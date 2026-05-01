export class CreateUserDto {
  // 用户名，字符串类型
  name!: string;
  // 年龄，数字类型
  age!: number;
  // 邮箱，可选字段（加了 ? 表示可以不传）
  email?: string;
}
