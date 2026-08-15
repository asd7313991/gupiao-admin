<template>
  <div class="page art-full-height">
    <ArtSearchBar v-model="filters" :items="[{label:'手机号',key:'phone',type:'input',props:{placeholder:'请输入手机号，不填查询全部用户流水'}}]" :show-expand="false" @search="load" @reset="reset"/>
    <ElCard class="art-table-card"><ArtTableHeader :loading="loading" @refresh="load"/>
      <ElTable v-loading="loading" :data="rows"><ElTableColumn type="index" label="序号" width="60"/><ElTableColumn prop="customer_id" label="用户ID"/><ElTableColumn prop="type" label="资金类型"/><ElTableColumn prop="direction" label="方向"/><ElTableColumn prop="remark" label="说明" min-width="220"/><ElTableColumn label="变动金额"><template #default="{row}"><span :class="row.amount>=0?'in':'out'">{{row.amount>=0?'+':''}}{{row.amount.toFixed(2)}}</span></template></ElTableColumn><ElTableColumn prop="balance" label="变动后余额"/><ElTableColumn prop="currency" label="币种"/><ElTableColumn prop="created_at" label="创建时间" min-width="170"/><ElTableColumn label="操作" width="80" fixed="right"><template #default="{row}"><ElButton text @click="view(row)">查看</ElButton></template></ElTableColumn></ElTable>
    </ElCard>
    <ElDialog v-model="visible" title="资金流水详情" width="540px"><ElDescriptions v-if="detail" :column="1" border><ElDescriptionsItem label="流水ID">{{detail.id}}</ElDescriptionsItem><ElDescriptionsItem label="用户ID">{{detail.customer_id}}</ElDescriptionsItem><ElDescriptionsItem label="资金类型">{{detail.type||'资金存入'}}</ElDescriptionsItem><ElDescriptionsItem label="方向"><ElTag :type="detail.amount>=0?'success':'danger'">{{detail.direction|| (detail.amount>=0?'入账':'出账')}}</ElTag></ElDescriptionsItem><ElDescriptionsItem label="说明">{{detail.remark||'无'}}</ElDescriptionsItem><ElDescriptionsItem label="变动金额"><span :class="detail.amount>=0?'in':'out'">{{detail.amount>=0?'+':''}}{{detail.amount.toFixed(2)}}</span></ElDescriptionsItem><ElDescriptionsItem label="变动后余额">{{detail.balance.toFixed(2)}}</ElDescriptionsItem><ElDescriptionsItem label="币种">{{detail.currency}}</ElDescriptionsItem><ElDescriptionsItem label="创建时间">{{detail.created_at}}</ElDescriptionsItem></ElDescriptions><template #footer><ElButton @click="visible=false">关闭</ElButton></template></ElDialog>
  </div>
</template>
<script setup lang="ts">
  import { fetchCustomerFundRecords, type CustomerFundRecord } from '@/api/system-manage'
  defineOptions({name:'UserFunds'})
  const loading=ref(false),rows=ref<CustomerFundRecord[]>([]),filters=reactive({phone:''}),visible=ref(false),detail=ref<CustomerFundRecord|null>(null)
  const load=async()=>{loading.value=true;try{rows.value=await fetchCustomerFundRecords(filters.phone)}finally{loading.value=false}}
  const reset=()=>{filters.phone='';load()};const view=(row:CustomerFundRecord)=>{detail.value=row;visible.value=true};onMounted(load)
</script>
<style scoped>.page{display:flex;flex-direction:column;gap:12px}.art-table-card{flex:1}.in{color:var(--el-color-success)}.out{color:var(--el-color-danger)}</style>