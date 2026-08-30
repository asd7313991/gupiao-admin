<template>
  <div class="page art-full-height">
    <ArtSearchBar v-model="filters" :items="searchItems" :show-expand="false" @search="load" @reset="reset"/>
    <ElCard class="art-table-card"><ArtTableHeader :loading="loading" @refresh="load"><template #left><ElButton @click="openBatch">按条件批量封禁/解封</ElButton></template></ArtTableHeader>
      <ElTable v-loading="loading" :data="rows"><ElTableColumn type="index" label="序号" width="60"/><ElTableColumn prop="customer_id" label="用户ID"/><ElTableColumn prop="device_type" label="设备类型"/><ElTableColumn prop="brand" label="品牌"/><ElTableColumn prop="device_model" label="设备型号"/><ElTableColumn prop="device_id" label="设备ID" min-width="160"/><ElTableColumn prop="api_base_url" label="API基础地址" min-width="220"/><ElTableColumn prop="system" label="系统"/><ElTableColumn prop="app_version" label="App版本"/><ElTableColumn label="封禁"><template #default="{row}"><ElSwitch :model-value="row.blocked===1" @change="toggle(row)"/></template></ElTableColumn></ElTable>
    </ElCard>
    <ElDialog v-model="batchVisible" title="按条件批量封禁/解封" width="500px"><ElForm label-width="105px"><ElFormItem label="手机号"><ElInput v-model="batch.phone" placeholder="选填：该号下全部上报记录"/></ElFormItem><ElFormItem label="设备ID"><ElInput v-model="batch.device_id" placeholder="选填：该设备ID下全部上报记录"/></ElFormItem><ElFormItem label="API基础地址"><ElInput v-model="batch.api_base_url" placeholder="选填：该 API 主机下全部设备"/></ElFormItem><p class="tip">至少填写一项；多项填写时，命中手机号相同、设备ID相同或 API 地址相同的记录。</p><ElFormItem label="操作" required><ElRadioGroup v-model="batch.blocked"><ElRadio :value="1">封禁</ElRadio><ElRadio :value="2">解封</ElRadio></ElRadioGroup></ElFormItem></ElForm><template #footer><ElButton @click="batchVisible=false">取消</ElButton><ElButton type="primary" @click="submitBatch">确定</ElButton></template></ElDialog>
  </div>
</template>
<script setup lang="ts">
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { batchUpdateCustomerDeviceBlocked, fetchCustomerDevices, updateCustomerDeviceBlocked, type CustomerDevice } from '@/api/system-manage'
  defineOptions({name:'UserDevices'})
  const loading=ref(false),rows=ref<CustomerDevice[]>([]),filters=reactive({phone:'',device_id:'',api_base_url:'',blocked:undefined as number|undefined})
  const searchItems=[{label:'手机号',key:'phone',type:'input',props:{placeholder:'请输入手机号'}},{label:'设备ID',key:'device_id',type:'input',props:{placeholder:'请输入设备ID'}},{label:'API基础地址',key:'api_base_url',type:'input',props:{placeholder:'请输入API基础地址'}},{label:'封禁',key:'blocked',type:'select',props:{placeholder:'全部',options:[{label:'封禁',value:1},{label:'正常',value:2}]}}]
  const load=async()=>{loading.value=true;try{const all=await fetchCustomerDevices(filters.phone);rows.value=all.filter(item=>(!filters.device_id||item.device_id.includes(filters.device_id))&&(!filters.api_base_url||item.api_base_url.includes(filters.api_base_url))&&(filters.blocked===undefined||item.blocked===filters.blocked))}finally{loading.value=false}}
  const reset=()=>{Object.assign(filters,{phone:'',device_id:'',api_base_url:'',blocked:undefined});load()}
  const toggle=async(row:CustomerDevice)=>{await updateCustomerDeviceBlocked(row.id,row.blocked===1?2:1);ElMessage.success('设备状态已更新');load()}
  const batchVisible=ref(false),batch=reactive({phone:'',device_id:'',api_base_url:'',blocked:1});const openBatch=()=>{Object.assign(batch,{phone:'',device_id:'',api_base_url:'',blocked:1});batchVisible.value=true}
  const submitBatch=async()=>{if(!batch.phone&&!batch.device_id&&!batch.api_base_url)return ElMessage.warning('请至少填写一个匹配条件');await ElMessageBox.confirm(`确定批量${batch.blocked===1?'封禁':'解封'}匹配设备吗？`,'批量设备操作',{type:'warning'});const result=await batchUpdateCustomerDeviceBlocked(batch);ElMessage.success(`操作完成，已更新 ${result.updated} 条记录`);batchVisible.value=false;load()}
  onMounted(load)
</script>
<style scoped>.page{display:flex;flex-direction:column;gap:12px}.art-table-card{flex:1}.tip{margin:-6px 0 16px 105px;color:var(--el-text-color-secondary);font-size:12px;line-height:1.6}</style>