import got from 'got'

const config = {
  city_id: 5,
  cid: 16,
  sc_distinct_id: 286633939,
  user_id: 286633939,
  user_key: 'b9c5e51c0d298ce080ceea0ccee5274ebqxeNbcW20230413173431',
  unit_id: 21,
  dep_id: 4385, // 科室id 口腔种植科
  doctor_id: 9153, // 医生id  李树春--口腔种植(种植牙)
  // dep_id: 200326638,
  // doctor_id: 9407,
  account_user_id: 31105057,
}

function sleep(ms: number = 100) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

async function getDoctor() {
  const resp = await got
    .get('https://wechatgate.91160.com/guahao/v1-1/sch/union/doctor', {
      searchParams: {
        city_id: config.city_id,
        cid: config.cid,
        user_id: config.user_id,
        sc_distinct_id: config.sc_distinct_id,
        user_key: config.user_key,
        unit_id: config.unit_id,
        dep_id: config.dep_id,
        account_user_id: config.account_user_id,
        doctor_id: config.doctor_id,
        all_point: 1,
        page: 1,
        select_date: '',
      },
    })
    .json<any>()
  console.log(resp)

  return resp.data
}

async function getGuahaodetail(schedule_id: string) {
  const { data } = await got
    .get('https://wechatgate.91160.com/guahao/v1/src/detail', {
      searchParams: {
        city_id: config.city_id,
        cid: config.cid,
        sc_distinct_id: config.sc_distinct_id,
        user_key: config.user_key,
        unit_id: config.unit_id,
        dep_id: config.dep_id,
        doctor_id: config.doctor_id,
        schedule_id: schedule_id,
        src_all: 1,
      },
    })
    .json<any>()
  return data
}

async function submitOrder(src: any) {
  const { data } = await got
    .post('https://wechatgate.91160.com/guahao/v1/order/submit', {
      searchParams: {
        city_id: config.city_id,
        cid: config.cid,
        sc_distinct_id: config.sc_distinct_id,
        user_key: config.user_key,
      },
      json: {
        mid: 140710451,
        unit_id: config.unit_id,
        dep_id: config.dep_id,
        sch_id: src.schedule_id,
        detl_id: src.src_id,
        to_date: src.to_date,
        doctor_id: config.doctor_id,
        disease_id: 0,
        inte_code: '',
        mobile: '17688712508',
        is_today_guahao: 0,
        province_id: 2,
        city_id: 5,
        counties_id: 8,
        member_address: '南山区粤海街道松日鼎盛大厦 5楼',
      },
    })
    .json<any>()
  return data
}

async function main() {
  const data = await getDoctor()

  const sch_list = []
  console.log(data)

  for (const row of data.sch_list) {
    const { am = [], pm = [] } = row.sch
    for (const m of [...am, ...pm]) {
      // [{
      //   "schedule_id": "24a73c2640b9eaf945756b445bb99a757f4e77717370",
      //   "unit_id": 21,
      //   "dep_id": 200099704,
      //   "doctor_id": 200367096,
      //   "is_selected_dep": 1,
      //   "to_date": "2023-03-17",
      //   "yuyue_max": 23,
      //   "yuyue_num": 4,
      //   "left_num": 19,
      //   "time_type": "am",
      //   "level_code": "102596325",
      //   "level_name": "副主任医师",
      //   "guahao_amt": "33.0",
      //   "y_state": 1,
      //   "y_state_desc": "挂号",
      //   "font_color": "#FFFFFF",
      //   "background_color": "#5ACF83",
      //   "y_state_clickdesc": ""
      // }]

      if (m.left_num > 0) {
        sch_list.push(m)
      }
    }
    if (sch_list.length <= 0) {
      console.log(`${row.day} ${row.week} 咩有可约的号`)
    } else {
      console.log(`准备预约 ${row.day} ${row.week} 的号`)
    }
    for (const sch of sch_list) {
      const schDetail = await getGuahaodetail(sch.schedule_id)
      const orders = ['10', '09', '11', '08', '14', '15', '16', '17', '18']
      schDetail.SchList = schDetail.SchList.sort((a: any, b: any) => {
        const startA = a.sch_time.substring(0, 2)
        const startB = b.sch_time.substring(0, 2)
        return orders.indexOf(startA) - orders.indexOf(startB)
      })
      for (const src of schDetail.SchList) {
        if (src.left_num > 0) {
          const srcInfo = { ...src, to_date: sch.to_date }
          console.log(
            `准备预约 ${srcInfo.to_date} ${srcInfo.sch_time} 现有${srcInfo.left_num}个号 `,
            srcInfo
          )
          const ret = await submitOrder(srcInfo)
          if (ret.state === 1) {
            console.log('预约成功', ret)
            return
          } else if (ret.state === -503) {
            console.log('预约成功', ret.msg)
            return
          } else {
            console.log('预约失败', ret)
          }
          await sleep(100)
        }
      }
    }
  }
}
async function start() {
  while (true) {
    main()
    await sleep(200)
  }
}

start()
