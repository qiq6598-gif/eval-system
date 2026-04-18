<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>评估系统</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box;font-family:"Times New Roman",SimSun,serif}
body{background:#f8f9fa;color:#2c3e50;padding:2rem}
.container{max-width:1400px;margin:0 auto}
.panel{background:#fff;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,0.06);padding:24px;margin-bottom:24px}
.title{font-size:22px;font-weight:600;margin-bottom:16px;color:#1f2937}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px}
.img-card{border-radius:12px;overflow:hidden;border:1px solid #e5e7eb}
.img-card img{width:100%;height:450px;object-fit:contain;background:#f9fafb}
.img-label{text-align:center;padding:12px;font-size:15px;background:#f3f4f6;font-weight:500}
.bar{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:16px}
input{padding:8px 12px;border:1px solid #d1d5db;border-radius:6px;width:180px}
button{padding:8px 16px;border:none;border-radius:6px;background:#3b82f6;color:#fff;cursor:pointer}
button.secondary{background:#64748b}
button.warn{background:#f59e0b}
button.danger{background:#ef4444}
button.group-btn{background:#10b981}
#qrcode{width:160px;margin:10px auto;display:block;border-radius:8px}
.table-box{overflow-x:auto;margin-top:12px}
table{width:100%;border-collapse:collapse;background:#fff}
th,td{border:1px solid #e5e7eb;padding:10px;text-align:center;font-size:14px}
th{background:#f3f4f6;font-weight:600}
.chart-row{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px}
.chart-box{height:420px;position:relative}
.empty-chart-msg{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#9ca3af;font-size:16px;display:none}
#resultPage,#groupResultPage,#adminPage{display:none}
.reference-card{text-align:center}
.reference-img{max-height:350px;max-width:100%;object-fit:contain;border-radius:8px}
.admin-lock{margin-bottom:16px;display:flex;gap:10px;align-items:center}
</style>
</head>
<body>

<div id="evalPage" class="container">
  <div class="panel">
    <div class="title">评估系统</div>
    <div class="bar">
      <input id="uid" placeholder="请输入评估者ID">
      <button onclick="loginUser()">登录/继续评估</button>
      <button onclick="getQrcode()">生成二维码</button>
      <button class="secondary" onclick="showResult()">查看统计（单图）</button>
      <button class="group-btn" onclick="showGroupResult()">查看统计（分组/权重）</button>
      <button class="danger" onclick="goAdmin()">管理员后台</button>
    </div>
    <img id="qrcode">
  </div>

  <div class="panel reference-card">
    <div class="title">现实拍摄参考图</div>
    <img class="reference-img" src="reference.png">
  </div>

  <div class="grid">
    <div class="img-card">
      <img id="imgA">
      <div class="img-label" id="labelA">A</div>
    </div>
    <div class="img-card">
      <img id="imgB">
      <div class="img-label" id="labelB">B</div>
    </div>
  </div>

  <div class="bar" style="justify-content:center;margin-top:10px">
    <button onclick="submit('A更接近真实')">A更接近真实</button>
    <button class="warn" onclick="submit('两者相似')">两者相似</button>
    <button onclick="submit('B更接近真实')">B更接近真实</button>
    <button class="secondary" onclick="nextPair()">下一组</button>
  </div>
</div>

<div id="resultPage" class="container">
  <div class="panel">
    <button onclick="backEval()">返回评估</button>
    <button class="group-btn" onclick="showGroupResult()">查看分组/权重统计</button>
    <button class="danger" onclick="goAdmin()">管理员后台</button>
  </div>
  <div class="chart-row">
    <div class="panel chart-box"><h3>30张图像胜率排行</h3><canvas id="barChart"></canvas></div>
    <div class="panel chart-box"><h3>6个组别获胜占比分布</h3><canvas id="groupPieChart"></canvas></div>
  </div>
  <div class="panel">
    <div class="title">单图详细数据</div>
    <div class="table-box">
      <table>
        <tr><th>图像</th><th>赢</th><th>平</th><th>输</th><th>总次数</th><th>胜率</th></tr>
        <tbody id="statBody"></tbody>
      </table>
    </div>
  </div>
</div>

<div id="groupResultPage" class="container">
  <div class="panel">
    <button onclick="backEval()">返回评估</button>
    <button class="secondary" onclick="showResult()">查看单图统计</button>
    <button class="danger" onclick="goAdmin()">管理员后台</button>
  </div>
  <div class="chart-row">
    <div class="panel chart-box"><h3>6个组别胜率排行</h3><canvas id="groupBarChart"></canvas></div>
    <div class="panel chart-box">
      <h3>5个权重获胜占比分布</h3><canvas id="weightPieChart"></canvas>
      <div class="empty-chart-msg" id="emptyWeightMsg">暂无权重数据</div>
    </div>
  </div>
  <div class="panel">
    <div class="title">组别统计数据</div>
    <div class="table-box">
      <table>
        <tr><th>组别</th><th>赢</th><th>平</th><th>输</th><th>总次数</th><th>胜率</th></tr>
        <tbody id="groupStatBody"></tbody>
      </table>
    </div>
  </div>
</div>

<div id="adminPage" class="container">
  <div class="panel">
    <div class="title">管理员后台（需密码）</div>
    <div class="admin-lock">
      <input id="adminPwd" type="password" placeholder="输入管理员密码">
      <button onclick="checkAdmin()">验证密码</button>
      <button onclick="backEval()">返回</button>
    </div>
    <div id="adminContent" style="display:none">
      <div class="bar">
        <button class="danger" onclick="clearAllData()">清空所有数据</button>
      </div>
      <div class="table-box">
        <table>
          <tr><th>ID</th><th>评估者</th><th>图像A</th><th>图像B</th><th>结果</th><th>时间</th><th>操作</th></tr>
          <tbody id="adminBody"></tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<script>
const images = [
"e3_0.2.png","e3_0.4.png","e3_0.6.png","e3_0.8.png","e3_1.0.png",
"e4_0.2.png","e4_0.4.png","e4_0.6.png","e4_0.8.png","e4_1.0.png",
"e5_0.2.png","e5_0.4.png","e5_0.6.png","e5_0.8.png","e5_1.0.png",
"re_0.2.png","re_0.4.png","re_0.6.png","re_0.8.png","re_1.0.png",
"con_0.2.png","con_0.4.png","con_0.6.png","con_0.8.png","con_1.0.png",
"500_0.2.png","500_0.4.png","500_0.6.png","500_0.8.png","500_1.0.png"
];

const groupMap = {
"e3":"e3","e4":"e4","e5":"e5",
"re":"restart",
"con":"constant warm up500",
"500":"cosine warm up500"
};

const groups = ["e3","e4","e5","re","con","500"];
const weights = ["0.2","0.4","0.6","0.8","1.0"];
let currentA, currentB;
let currentUid = "";

let barChart, groupPieChart, groupBarChart, weightPieChart;

function nextPair(){
  do{
    currentA = images[Math.random()*images.length|0];
    currentB = images[Math.random()*images.length|0];
  }while(currentA===currentB);
  document.getElementById("imgA").src = currentA;
  document.getElementById("imgB").src = currentB;
  
  // 只显示A/B，不显示文件名
  document.getElementById("labelA").innerText = "A";
  document.getElementById("labelB").innerText = "B";
}

async function loginUser(){
  const uid = document.getElementById("uid").value.trim();
  if(!uid) return alert("请输入评估者ID");
  currentUid = uid;
  alert("欢迎回来：" + uid);
  nextPair();
}

async function submit(result){
  if(!currentUid){
    alert("请先点击【登录/继续评估】");
    return;
  }
  await fetch("/api/submit",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({uid:currentUid,imgA:currentA,imgB:currentB,result})
  });
  nextPair();
}

async function getQrcode(){
  const r = await fetch("/api/qrcode");
  const d = await r.json();
  document.getElementById("qrcode").src = d.qrcode;
}

function showResult(){
  document.getElementById("evalPage").style.display="none";
  document.getElementById("groupResultPage").style.display="none";
  document.getElementById("adminPage").style.display="none";
  document.getElementById("resultPage").style.display="block";
  loadSingleStats();
}

function showGroupResult(){
  document.getElementById("evalPage").style.display="none";
  document.getElementById("resultPage").style.display="none";
  document.getElementById("adminPage").style.display="none";
  document.getElementById("groupResultPage").style.display="block";
  loadGroupWeightStats();
}

function backEval(){
  document.getElementById("evalPage").style.display="block";
  document.getElementById("resultPage").style.display="none";
  document.getElementById("groupResultPage").style.display="none";
  document.getElementById("adminPage").style.display="none";
}

function goAdmin(){
  document.getElementById("evalPage").style.display="none";
  document.getElementById("resultPage").style.display="none";
  document.getElementById("groupResultPage").style.display="none";
  document.getElementById("adminPage").style.display="block";
}

function checkAdmin(){
  const pwd = document.getElementById("adminPwd").value.trim();
  if(pwd === "siqihu7"){
    document.getElementById("adminContent").style.display="block";
    loadAdminData();
  }else{
    alert("密码错误");
  }
}

async function loadSingleStats(){
  const r = await fetch("/api/stats");
  const d = await r.json();
  const groupWin = {e3:0,e4:0,e5:0,re:0,con:0,500:0};
  d.list.forEach(item=>{
    const g = item.name.split("_")[0];
    if(groupWin[g]!==undefined) groupWin[g] += item.win;
  });

  const sb = document.getElementById("statBody");
  sb.innerHTML = "";
  d.list.forEach(o=>{
    sb.innerHTML+=`<tr>
      <td>${o.name}</td><td>${o.win}</td><td>${o.tie}</td><td>${o.lose}</td><td>${o.total}</td><td>${o.rate}</td>
    </tr>`;
  });

  if(barChart) barChart.destroy();
  if(groupPieChart) groupPieChart.destroy();

  barChart = new Chart(document.getElementById("barChart"),{
    type:"bar",
    data:{
      labels:d.list.map(o=>o.name),
      datasets:[{label:"胜率",data:d.list.map(o=>o.rate),backgroundColor:"#3b82f6"}]
    },
    options:{indexAxis:"y",scales:{x:{beginAtZero:true,max:1}}}
  });

  groupPieChart = new Chart(document.getElementById("groupPieChart"),{
    type:"pie",
    data:{
      labels:groups.map(g=>groupMap[g]),
      datasets:[{data:groups.map(g=>groupWin[g]),backgroundColor:["#3b82f6","#10b981","#f59e0b","#8b5cf6","#ec4899","#6b7280"]}]
    }
  });
}

async function loadGroupWeightStats(){
  const r = await fetch("/api/stats");
  const d = await r.json();
  const groupData = {e3:{w:0,t:0,l:0},e4:{w:0,t:0,l:0},e5:{w:0,t:0,l:0},re:{w:0,t:0,l:0},con:{w:0,t:0,l:0},500:{w:0,t:0,l:0}};
  const weightWin = {"0.2":0,"0.4":0,"0.6":0,"0.8":0,"1.0":0};

  d.list.forEach(o=>{
    const g = o.name.split("_")[0];
    const foundW = weights.find(w=>o.name.includes(`_${w}.png`));
    if(groupData[g]){
      groupData[g].w += o.win;
      groupData[g].t += o.tie;
      groupData[g].l += o.lose;
    }
    if(foundW) weightWin[foundW] += o.win;
  });

  const groupList = groups.map(g=>({
    name:groupMap[g],
    win:groupData[g].w,
    tie:groupData[g].t,
    lose:groupData[g].l,
    total:groupData[g].w+groupData[g].t+groupData[g].l,
    rate: ((groupData[g].w/(groupData[g].w+groupData[g].t+groupData[g].l))||0).toFixed(2)
  })).sort((a,b)=>b.rate-a.rate);

  const gsb = document.getElementById("groupStatBody");
  gsb.innerHTML = "";
  groupList.forEach(o=>{
    gsb.innerHTML+=`<tr>
      <td>${o.name}</td><td>${o.win}</td><td>${o.tie}</td><td>${o.lose}</td><td>${o.total}</td><td>${o.rate}</td>
    </tr>`;
  });

  if(groupBarChart) groupBarChart.destroy();
  if(weightPieChart) weightPieChart.destroy();

  const weightData = weights.map(w=>weightWin[w]);
  const hasData = weightData.some(v=>v>0);
  document.getElementById("emptyWeightMsg").style.display = hasData?"none":"block";

  groupBarChart = new Chart(document.getElementById("groupBarChart"),{
    type:"bar",
    data:{
      labels:groupList.map(o=>o.name),
      datasets:[{label:"组胜率",data:groupList.map(o=>o.rate),backgroundColor:"#10b981"}]
    },
    options:{indexAxis:"y",scales:{x:{beginAtZero:true,max:1}}}
  });

  weightPieChart = new Chart(document.getElementById("weightPieChart"),{
    type:"pie",
    data:{
      labels:weights.map(w=>`权重 ${w}`),
      datasets:[{data:weightData,backgroundColor:["#3b82f6","#10b981","#f59e0b","#8b5cf6","#ec4899"]}]
    }
  });
}

async function loadAdminData(){
  const r = await fetch("/api/allRecords");
  const data = await r.json();
  const b = document.getElementById("adminBody");
  b.innerHTML = "";
  data.forEach(row=>{
    b.innerHTML+=`
    <tr>
      <td>${row.id}</td>
      <td>${row.uid}</td>
      <td>${row.imgA}</td>
      <td>${row.imgB}</td>
      <td>${row.result}</td>
      <td>${row.time}</td>
      <td>
        <button class="danger" onclick="delOne(${row.id})">删除</button>
        <button class="danger" onclick="delUser('${row.uid}')">删用户全部</button>
      </td>
    </tr>`;
  });
}

async function delOne(id){
  await fetch(`/api/delete/${id}`,{method:"DELETE"});
  loadAdminData();
}

async function delUser(uid){
  if(!confirm(`确定删除【${uid}】所有记录？`)) return;
  await fetch(`/api/deleteUser/${uid}`,{method:"DELETE"});
  loadAdminData();
}

async function clearAllData(){
  if(!confirm("确定清空所有数据？不可恢复！")) return;
  await fetch("/api/clearAll",{method:"DELETE"});
  loadAdminData();
}

nextPair();
</script>
</body>
</html>
