const Automation = require('../model/automation_model')
const { getClusters } = require('../../utils/kmeans')

let placeIds = [
    "台北車站",
    "中正紀念堂",
    "士林夜市",
    "北投捷運站",
    "饒河街",
    "市政府",
    "國父紀念館",
    "松山高中",
    "捷運大安站",
    "台灣大學",
    "捷運龍山寺站",
    "捷運西門站",
    "捷運大直站",
    "捷運內湖站"
]
let vectors = {
    台北車站:[25.0477942,121.5169537],
    中正紀念堂:[25.0346119,121.521781],
    士林夜市:[25.0879869,121.5242024],
    北投捷運站:[25.1317795,121.4986418],
    饒河街:[25.0504785,121.5751126],
    市政府:[25.0375417,121.5644327],
    國父紀念館:[25.0400306,121.5602452],
    松山高中:[25.0437709,121.5648601],
    捷運大安站:[25.0329936,121.5435968],
    台灣大學:[25.0173405,121.5397518],
    捷運龍山寺站:[25.0352501,121.5004297],
    捷運西門站:[25.0419242,121.5080936],
    捷運大直站:[25.0798837,121.5471493],
    捷運內湖站:[25.0835589,121.5942486]
}
let days = 4;
let startSpot = '北投捷運站'
let startTime = '09:00'

const calculateTrips = async (req, res, next) => {
    //let { placeIds, vectors, days, startSpot } = req.body;
    let clusters = getClusters(placeIds, vectors, days, startSpot);
    let order = clusters.inOrder; //[3,2]

    let lingerTimes = Automation.getSpotDetails(clusters[order[0]]);
    //add transport time

}


module.exports = {
    calculateTrips
}

