class RegisterAppCodeException extends Error {
    constructor(message) {
      super(message);
      this.name = 'RegisterAppCodeException';
    }
}

class InsufficientRetryTimesException extends Error {
    constructor(message) {
      super(message);
      this.name = 'InsufficientRetryTimesException';
    }
}

class RequestNotReadyForServiceMeshException extends Error {
    constructor(message) {
      super(message);
      this.name = 'RequestNotReadyForServiceMeshException';
    }
}

module.exports = {
    RegisterAppCodeException,
    InsufficientRetryTimesException,
    RequestNotReadyForServiceMeshException
}