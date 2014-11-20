import Promise = require('./Promise');

class DataRequest {

    static send(url: string, requestType?: string) : Promise {
        var xhr = new XMLHttpRequest();
        var isCanceled = false;
        var completeCallback;
        var errorCallback;

        function _sendRequest(complete, error) {
            completeCallback = complete;
            errorCallback = error;

            xhr.open(requestType || 'GET', url, true);
            xhr.send();
        }

        function _cancelRequest() {
            isCanceled = true;
            xhr.abort();
        }

        function _completeRequest() {
            var response;

            if (!isCanceled) {
                if (xhr.status == 200) {
                    response = JSON.parse(xhr.response);
                    completeCallback(response);
                } else {
                    errorCallback({
                        status: xhr.status,
                        message: xhr.responseText
                    });
                }
            }
        }

        xhr.onreadystatechange = function(ev) {
            if (xhr.readyState == 4) {
                _completeRequest();
            }
        };

        return new Promise(_sendRequest, _cancelRequest);
    }
}

export = DataRequest;