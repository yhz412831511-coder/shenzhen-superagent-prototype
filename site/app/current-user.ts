/** 原型中的脱敏占位身份，不对应真实人员或机构。 */
export const currentUser = {
  name: '杨XX',
  organization: '深圳市XX局',
  department: 'XX处',
  role: '科员',
  organizationType: '市级政务部门（脱敏占位）',
  source: '用户指定的脱敏占位信息',
} as const;
