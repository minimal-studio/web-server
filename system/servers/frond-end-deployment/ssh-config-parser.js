const hostRegex = /^Host/g;
const sshParser = (sshStr) => {
  let hostList = {};
  
  sshStr.split('\n').filter(str => {
    let useless = !str || !hostRegex.test(str) || /^# ?/.test(str);
    return !useless;
  }).forEach(item => {
    let host = item.trim().split(/ +/);
    let hostName = host[1];
    let alias = host[2] || hostName;
    hostList[hostName] = alias;
  });
  // console.log(hostList);
  return hostList;
}

module.exports = sshParser;
