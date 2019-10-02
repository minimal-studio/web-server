// 请求回应的格式
export interface ApiResponse {
  // api 业务状态码，0为成功，其余为其他情况
  code: number;
  // 具体状态消息
  message: string;
  // 具体数据
  data: any;
}

// 发送请求的格式
export type ApiRequest = {}
