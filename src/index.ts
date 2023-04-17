import got from 'got'

const config = {
  city_id: 5,
  cid: 16,
  sc_distinct_id: 286633939,
  user_id: 286633939,
  user_key: 'e4dcf97246c9c1804ca135c90df1a195vlKExAer20230517145939',
  unit_id: 21,
  // dep_id: 4385, // 科室id 口腔种植科
  // doctor_id: 9153, // 医生id  李树春--口腔种植(种植牙)
  dep_id: 200326638,
  doctor_id: 9407,
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
  // console.log('getGuahaodetail', data)
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
  for (const row of data.sch_list) {
    const { am = [], pm = [] } = row.sch
    for (const m of [...am, ...pm]) {
      if (m.left_num > 0) {
        sch_list.push(m)
      }
    }
  }
  sleep(500)
  if (sch_list.length <= 0) {
    return
  } else {
    console.log(`准备预约 `)
  }
  for (const sch of sch_list) {
    const schDetail = await getGuahaodetail(sch.schedule_id)
    // const orders = ['10', '09', '11', '08', '14', '15', '16', '17', '18']
    // schDetail.SchList = schDetail.SchList.sort((a: any, b: any) => {
    //   const startA = a.sch_time.substring(0, 2)
    //   const startB = b.sch_time.substring(0, 2)
    //   return orders.indexOf(startA) - orders.indexOf(startB)
    // })
    for (const src of schDetail.SchList) {
      if (src.left_num > 0) {
        const srcInfo = { ...src, to_date: sch.to_date }
        console.log(`预约连接 ${srcInfo.to_date} ${srcInfo.sch_time} 现有${srcInfo.left_num}个号 `)
        console.log(
          `https://weixin.91160.com/h5/register/confirmOrder/index.html?unit_id=${config.unit_id}&dep_id=${config.dep_id}&doctor_id=${config.doctor_id}&sch_id=${srcInfo.schedule_id}&detl_id=${srcInfo.src_id}&isVideo=2&srcext_amt=25.0&from_function_id=DOC_GH_YUYUE1&from_function_name=%E5%8C%BB%E7%94%9F%E4%B8%BB%E9%A1%B5_%E6%8C%82%E5%8F%B7_%E9%A2%84%E7%BA%A6`
        )
      }
    }
    sleep(500)
  }
}
async function start() {
  main()
}

start()
