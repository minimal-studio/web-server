const projectEntity = {
  id: "",
  projName: "",
  createdDate: 0,
  motifyDate: 0,
  projCode: "",
  projDesc: "",
  founder: "",
  webhook: "",
  host: "",
  scpSourceDir: "",
  scpTargetHost: "",
  scpTargetDir: "",
  collaborators: {
    admin: {
      "updatable": 1,
      "deletable": 1,
      "releasable": 1
    }
  },
  collaboratorApplies: [],
  assetsCount: 0,
  assetNumb: 0,
  pushMode: 'push-files',
  releaseRef: ""
}

module.exports = projectEntity;