import Promise = require('./Promise');
declare class DataRequest {
    static send(url: string, requestType?: string): Promise;
}
export = DataRequest;
