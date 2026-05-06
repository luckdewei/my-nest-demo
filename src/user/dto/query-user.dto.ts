export class QueryUserDto {
  // 当前页码，不传默认第 1 页
  // URL 参数都是字符串，service 里会转成数字
  page?: string;

  // 每页显示条数，不传默认 10 条
  pageSize?: string;

  // 按用户名模糊搜索，可选
  // 例如传 "cc"，会匹配所有名字包含"cc"的用户
  name?: string;

  // 按角色过滤，可选
  // 例如传 "admin"，只返回管理员用户
  role?: string;
}
