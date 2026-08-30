<template>
  <div class="page art-full-height">
    <ArtSearchBar v-model="filters" :items="searchItems" :show-expand="false" @search="load" @reset="reset" />
    <ElCard class="art-table-card"><ArtTableHeader :loading="loading" @refresh="load" />
      <ElTable v-loading="loading" :data="rows"><ElTableColumn type="index" label="序号" width="60"/><ElTableColumn prop="phone" label="手机号"/><ElTableColumn prop="bank_card" label="银行卡号" min-width="180"/><ElTableColumn prop="name" label="持卡人姓名"/><ElTableColumn prop="id_card" label="身份证号" min-width="180"/><ElTableColumn prop="bank_name" label="开户行"/><ElTableColumn prop="bank_address" label="开户地址" min-width="180"/><ElTableColumn prop="updated_at" label="更新时间" min-width="170"/><ElTableColumn label="操作" width="80" fixed="right"><template #default="{row}"><ElDropdown trigger="click"><ElButton text class="more">⋮</ElButton><template #dropdown><ElDropdownMenu><ElDropdownItem @click="view(row)">查看</ElDropdownItem><ElDropdownItem @click="edit(row)">修改</ElDropdownItem></ElDropdownMenu></template></ElDropdown></template></ElTableColumn></ElTable>
    </ElCard>
    <ElDialog v-model="detailVisible" title="银行卡详情" width="620px"><ElDescriptions v-if="detail" :column="2" border><ElDescriptionsItem label="用户ID">{{detail.id}}</ElDescriptionsItem><ElDescriptionsItem label="手机号">{{detail.phone}}</ElDescriptionsItem><ElDescriptionsItem label="持卡人">{{detail.name}}</ElDescriptionsItem><ElDescriptionsItem label="身份证号">{{detail.id_card}}</ElDescriptionsItem><ElDescriptionsItem label="银行卡号" :span="2">{{detail.bank_card}}</ElDescriptionsItem><ElDescriptionsItem label="开户行">{{detail.bank_name}}</ElDescriptionsItem><ElDescriptionsItem label="开户地址">{{detail.bank_address||'未填写'}}</ElDescriptionsItem></ElDescriptions><template #footer><ElButton @click="detailVisible=false">关闭</ElButton></template></ElDialog>
    <ElDialog v-model="editorVisible" title="修改银行卡" width="520px"><ElForm ref="formRef" :model="form" :rules="rules" label-width="90px"><ElFormItem label="持卡人"><ElInput :model-value="editing?.name" disabled/></ElFormItem><ElFormItem label="手机号"><ElInput :model-value="editing?.phone" disabled/></ElFormItem><ElFormItem label="银行卡号" prop="bank_card"><ElInput v-model="form.bank_card"/></ElFormItem><ElFormItem label="开户行" prop="bank_name"><ElInput v-model="form.bank_name"/></ElFormItem><ElFormItem label="开户地址"><ElInput v-model="form.bank_address"/></ElFormItem></ElForm><template #footer><ElButton @click="editorVisible=false">取消</ElButton><ElButton type="primary" @click="save">保存</ElButton></template></ElDialog>
  </div>
</template>
<script setup lang="ts">
  import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
  import { fetchCustomerDetail, fetchCustomers, updateCustomerBank, type Customer } from '@/api/system-manage'
  defineOptions({name:'UserBanks'})
  const loading=ref(false),rows=ref<Customer[]>([]),filters=reactive({phone:'',card:'',bank:''})
  const searchItems=[{label:'手机号',key:'phone',type:'input',props:{placeholder:'请输入手机号'}},{label:'银行卡号',key:'card',type:'input',props:{placeholder:'请输入银行卡号'}},{label:'开户行',key:'bank',type:'input',props:{placeholder:'请输入开户行'}}]
  const load=async()=>{loading.value=true;try{const data=await fetchCustomers({phone:filters.phone,page:1,pageSize:100});rows.value=data.records.filter(item=>(!filters.card||item.bank_card.includes(filters.card))&&(!filters.bank||item.bank_name.includes(filters.bank)))}finally{loading.value=false}}
  const reset=()=>{Object.assign(filters,{phone:'',card:'',bank:''});load()}
  const detailVisible=ref(false),detail=ref<Customer|null>(null);const view=async(row:Customer)=>{detail.value=await fetchCustomerDetail(row.id);detailVisible.value=true}
  const editorVisible=ref(false),editing=ref<Customer|null>(null),form=reactive({bank_name:'',bank_card:'',bank_address:''}),formRef=ref<FormInstance>();const rules:FormRules={bank_name:[{required:true,message:'请输入开户行',trigger:'blur'}],bank_card:[{required:true,message:'请输入银行卡号',trigger:'blur'}]}
  const edit=(row:Customer)=>{editing.value=row;Object.assign(form,{bank_name:row.bank_name,bank_card:row.bank_card,bank_address:row.bank_address});editorVisible.value=true}
  const save=async()=>{if(!editing.value)return;await formRef.value?.validate();await updateCustomerBank({id:editing.value.id,...form});ElMessage.success('银行卡资料已更新');editorVisible.value=false;load()}
  onMounted(load)
</script>
<style scoped>.page{display:flex;flex-direction:column;gap:12px}.art-table-card{flex:1}.more{font-size:22px}</style>