const hostRegex = /^Host/g;
const sshParser = (sshStr) => {
  let hostList = sshStr.split('\n').filter(str => {
    let useless = !str || !hostRegex.test(str) || /^# ?/.test(str);
    return !useless;
  }).map(item => (item.trim().split(' ')[1]));
  // console.log(hostList);
  return hostList;
}

module.exports = sshParser;
