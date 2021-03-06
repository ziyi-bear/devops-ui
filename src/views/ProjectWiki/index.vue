<script>
import { mapGetters, mapActions } from 'vuex'

import Pagination from '@/components/Pagination'
import ProjectListSelector from '../../components/ProjectListSelector'
// import WangEditor from '@/components/Wangeditor'
import EditorMD from '@/components/Editormd'
import { getWikiList, getWikiDetail, putWikiDetail, deleteWiki } from '@/api/wiki'
import { formatTime } from '../../utils/index.js'
import { Message } from 'element-ui'

export default {
  components: {
    // WangEditor,
    EditorMD,
    ProjectListSelector,
    Pagination
  },
  data() {
    return {
      isLoading: false,
      listLoading: true,
      editBtnLoading: false,
      direction: 'rtl',
      wikiList: [],
      wikiData: {},
      wikiContent: 'Hello DevOps',
      newWikiContent: '',
      detailVisible: false,
      dialogVisible: false,
      dialogVisibleEdit: false,
      drawerTitle: '',
      wikiTitle: '',
      listQuery: {
        page: 1,
        limit: 10
      },
      listTotal: 0, // 總筆數
      searchData: '',
      formRules: {
        wikiTitle: [{ required: true, message: 'Please input name', trigger: 'change' },
          { pattern: /^((?!,|\.|\/|\?|;|:|\|).)*$/, message: 'Not allowing special characters (, . / ? ; : |)', trigger: 'blur' }]
      },
      form: { wikiTitle: '' }
    }
  },
  computed: {
    ...mapGetters(['projectSelectedId']),
    pagedData() {
      const listData = this.wikiList.filter((data) => {
        if (this.searchData == '' || data.title.toLowerCase().includes(this.searchData.toLowerCase())) {
          return data
        }
      })
      this.listTotal = listData.length
      const start = (this.listQuery.page - 1) * this.listQuery.limit
      const end = start + this.listQuery.limit
      return listData.slice(start, end)
    }
  },
  watch: {
    projectSelectedId() {
      this.fetchData()
    }
  },
  async created() {
    this.fetchData()
  },
  methods: {
    async fetchData() {
      this.listLoading = true
      const res = await getWikiList(this.projectSelectedId)
      this.wikiList = res.data.wiki_pages
      this.listLoading = false
    },
    emitGetEditorData(value) {
      this.newWikiContent = value
    },
    handleClose() {
      this.detailVisible = false
    },
    async handleUpdate() {
      this.editBtnLoading = true
      const text = this.newWikiContent
      try {
        await putWikiDetail(this.projectSelectedId, this.wikiData.title, { wiki_text: text })
        Message({
          message: 'Wiki update successfully',
          type: 'success',
          duration: 1 * 3000
        })
        this.dialogVisible = false
      } catch (error) {
        console.error(error)
      }
      this.editBtnLoading = false
    },
    onPagination(listQuery) {
      this.listQuery = listQuery
    },
    myFormatTime(time) {
      return formatTime(new Date(time))
    },
    async handleEdit(idx, row) {
      this.listLoading = true
      this.drawerTitle = 'Edit'
      try {
        const res = await getWikiDetail(this.projectSelectedId, row.title)
        const { wiki_page } = res.data
        this.wikiData = wiki_page
        this.wikiTitle = wiki_page.title
        this.wikiContent = wiki_page.text
        console.log(wiki_page.text)
        this.dialogVisible = true
      } catch (error) {
        console.error(error)
      }
      this.listLoading = false
    },
    async handleDelete(idx, row) {
      this.listLoading = true
      try {
        await deleteWiki(this.projectSelectedId, row.title)
        this.fetchData()
      } catch (error) {
        console.error(error)
      }

      this.listLoading = false
    },
    async handleDetail(idx, row) {
      try {
        this.listLoading = false
        this.drawerTitle = 'Detail'
        const res = await getWikiDetail(this.projectSelectedId, row.title)
        const { wiki_page } = res.data
        this.wikiData = wiki_page
        this.wikiContent = wiki_page.text
        this.detailVisible = true
        this.dialogVisibleEdit = false
      } catch (error) {
        console.error(error)
      } finally {
        this.listLoading = false
      }
    },
    async handleAdding() {
      this.dialogVisible = true
      this.drawerTitle = 'Add'
      this.wikiContent = '# WIKI'
      this.newWikiContent = '# WIKI'
      this.form.wikiTitle = ''
      this.$refs['form'].resetFields()
    },
    async handleConfirmAdd() {
      this.$refs['form'].validate(async(valid) => {
        if (!valid) {
          return
        }
        this.editBtnLoading = true
        const text = this.newWikiContent
        try {
          await putWikiDetail(this.projectSelectedId, this.form.wikiTitle, { wiki_text: text })
          Message({
            message: 'Wiki create successfully',
            type: 'success',
            duration: 1 * 3000
          })
          this.fetchData()
        } catch (error) {
          console.error(error)
        } finally {
          this.dialogVisible = false
          this.editBtnLoading = false
        }
      })
    }
  }
}
</script>
<template>
  <div v-loading="isLoading" class="app-container">
    <div class="clearfix">
      <project-list-selector />
      <span class="newBtn">
        <el-button type="success" @click="handleAdding">
          <i class="el-icon-plus" />
          Add Ｗiki
        </el-button>
      </span>
      <el-input
        v-model="searchData"
        class="ob-search-input ob-shadow search-input mr-3"
        placeholder="Please input wiki title"
        style="width: 250px; float: right"
      ><i slot="prefix" class="el-input__icon el-icon-search" /></el-input>
    </div>

    <el-divider />
    <!-- <div class="filter-container">
      <el-button class="filter-item" type="primary" @click="dialogVisible = true">
        Edit
      </el-button>
    </div> -->
    <el-table v-loading="listLoading" :data="pagedData" element-loading-text="Loading" border fit highlight-current-row>
      <el-table-column prop="title" label="Title" />
      <el-table-column prop="version" label="Version" width="160" />
      <el-table-column label="Created" width="240">
        <template slot-scope="scope">
          <span>{{ myFormatTime(scope.row.created_on) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Updated" width="240">
        <template slot-scope="scope">
          <span>{{ myFormatTime(scope.row.updated_on) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Actions" width="300" align="center">
        <template slot-scope="scope">
          <el-button size="mini" type="primary" plain @click="handleDetail(scope.$index, scope.row)">
            <i class="el-icon-document" />
            Detail
          </el-button>
          <el-button size="mini" type="primary" @click="handleEdit(scope.$index, scope.row)">
            <i class="el-icon-edit" />
            Edit
          </el-button>
          <el-popconfirm
            confirm-button-text="Delete"
            cancel-button-text="Cancel"
            icon="el-icon-info"
            icon-color="red"
            title="Are you sure?"
            @onConfirm="handleDelete(scope.$index, scope.row)"
          >
            <el-button slot="reference" size="mini" type="danger"> <i class="el-icon-delete" /> Delete</el-button>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
    <pagination
      :total="listTotal"
      :page="listQuery.page"
      :limit="listQuery.limit"
      :page-sizes="[listQuery.limit]"
      :layout="'total, prev, pager, next'"
      @pagination="onPagination"
    />

    <el-drawer
      :title="`${drawerTitle} Wiki`"
      :visible.sync="dialogVisible"
      :direction="direction"
      :before-close="handleClose"
      :append-to-body="true"
      :with-header="false"
      size="80%"
    >
      <div class="container">
        <el-form v-if="drawerTitle === 'Add'" ref="form" :model="form" :rules="formRules" label-position="top">
          <el-form-item label="Title" prop="wikiTitle">
            <!-- <div class="form__title"> -->
            <el-input v-model="form.wikiTitle" placeholder="Please Input Title" />
            <!-- </div> -->
          </el-form-item>
        </el-form>
        <h3 v-else>{{ wikiData.title }}</h3>
        <div class="form__body">
          <br>
          <template>
            <!-- <WangEditor @get-editor-data="emitGetEditorData" :content="wikiContent" ref="editor" /> -->
            <EditorMD v-if="dialogVisible" id="editormd" :content="wikiContent" @get-editor-data="emitGetEditorData" />
          </template>
        </div>
        <div class="form__footer">
          <el-button
            @click="
              dialogVisible = false
              dialogVisibleEdit = false
            "
          >
            Cancel
          </el-button>
          <el-button v-if="drawerTitle === 'Edit'" type="primary" :loading="editBtnLoading" @click="handleUpdate">
            Confirm
          </el-button>
          <el-button
            v-else-if="drawerTitle === 'Add'"
            type="primary"
            :loading="editBtnLoading"
            @click="handleConfirmAdd"
          >
            Confirm
          </el-button>
        </div>
      </div>
    </el-drawer>
    <el-drawer
      :title="`${drawerTitle} Wiki`"
      :visible.sync="detailVisible"
      :direction="direction"
      :before-close="handleClose"
      :append-to-body="true"
      :with-header="false"
      size="80%"
    >
      <div class="container">
        <div class="form__title">
          <h3>{{ wikiData.title }}</h3>
        </div>
        <div class="form__body">
          <VueShowdown :markdown="wikiContent" />
        </div>
        <div class="form__footer">
          <el-button @click="detailVisible = false"> Close </el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>
<style lang="scss">
/* Wiki detail scroll bar*/
.el-drawer__body {
  height: 100%;
  box-sizing: border-box;
  overflow-y: auto;
  padding: 5px;
}
.clearfix {
  clear: both;
  .newBtn {
    float: right;
    padding-right: 6px;
  }
}
.container {
  display: flex;
  height: 100%;
  flex-direction: column;
  padding: 20px;
  .form__title {
    flex-basis: 60px;
  }
  .form__body {
    flex: 1;
  }
  .form__footer {
    flex-basis: 60px;
    padding-top: 20px;
    text-align: right;
  }

  /* table 样式 */
  table {
    border-top: 1px solid #ccc;
    border-left: 1px solid #ccc;
  }
  table td,
  table th {
    border-bottom: 1px solid #ccc;
    border-right: 1px solid #ccc;
    padding: 3px 5px;
  }
  table th {
    border-bottom: 2px solid #ccc;
    text-align: center;
  }

  /* blockquote 样式 */
  blockquote {
    display: block;
    border-left: 8px solid #d0e5f2;
    padding: 5px 10px;
    margin: 10px 0;
    line-height: 1.4;
    font-size: 100%;
    background-color: #f1f1f1;
  }

  /* code 样式 */
  code {
    display: inline-block;
    *display: inline;
    *zoom: 1;
    background-color: #f1f1f1;
    border-radius: 3px;
    padding: 3px 5px;
    margin: 0 3px;
  }
  pre code {
    display: block;
  }

  /* ul ol 样式 */
  ul,
  ol {
    margin: 10px 0 10px 20px;
  }
  #editor-container {
    flex: 1;
  }
  .file-commit-message {
    flex-basis: 160px;
  }
  >>> #w-e-text {
    white-space: pre-line;
  }
}
</style>
