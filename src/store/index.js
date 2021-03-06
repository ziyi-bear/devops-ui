import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'
import app from './modules/app'
import settings from './modules/settings'
import user from './modules/user'
import projects from './modules/projects'
import branches from './modules/branches'
import fileList from './modules/fileList'
import commitList from './modules/commitList'
import permission from './modules/permission'
import tags from './modules/tags'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    app,
    settings,
    user,
    projects,
    branches,
    fileList,
    commitList,
    permission,
    tags
  },
  getters
})

export default store
