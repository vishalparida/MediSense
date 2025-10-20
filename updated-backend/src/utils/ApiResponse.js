export class ApiResponse {
  constructor(data, message = "success") {
    this.success = true;
    this.message = message;
    this.data = data;
  }
}
