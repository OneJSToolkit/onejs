/// <summary>Navigation helper class. You must instantiate it to use.</summary>
define(["require", "exports", './EventGroup'], function(require, exports, EventGroup) {
    var _history = window["history"];
    var _supportsHistoryApi = history && !!history.pushState;

    var Navigation = (function () {
        function Navigation() {
            this.isRebasingEnabled = true;
            this.url = '';
            this.viewParams = {};
            this.viewParamsString = '';
            this._events = new EventGroup(this);
            this._events.declare('change');

            this._events.on(window, 'hashchange', this._updateUrlState);
            this._events.on(window, 'popstate', this._updateUrlState);
            this._updateUrlState();
        }
        Navigation.prototype.navigateTo = function (url, frameId) {
            if (url[0] == '#') {
                this._pushState(url.substr(1));
            } else {
                window.location.href = url;
            }
        };

        Navigation.prototype.reload = function () {
            window.location.reload();
        };

        Navigation.prototype._updateUrlState = function () {
            /// <summary>Updates the view params.</summary>
            var paramsString = '';
            var hasChanged = false;
            var location = window.document.location;
            var replaceParams;

            if (location.hash.length > 1) {
                paramsString = location.hash.substr(1);
                if (_supportsHistoryApi && this.isRebasingEnabled) {
                    replaceParams = paramsString;
                }
            } else if (location.search.length > 1) {
                paramsString = location.search.substr(1);
            }

            if (paramsString != this.viewParamsString) {
                this.viewParams = {};
                this.viewParamsString = paramsString || "";
                hasChanged = true;

                if (this.viewParamsString) {
                    var paramParts = this.viewParamsString.split("&");

                    for (var i = 0; i < paramParts.length; i++) {
                        var param = paramParts[i].split("=");

                        this.viewParams[param[0]] = decodeURIComponent(param[1]);
                    }
                }
            }

            // If we have found params to replace
            if (replaceParams) {
                this._replaceState(replaceParams);
            }

            if (hasChanged) {
                this._events.raise('change');
            }

            return hasChanged;
        };

        Navigation.prototype._pushState = function (viewParams) {
            /// <summary>Adds an entry to the navigation stack.</summary>
            /// <param name="viewParams">An object containing the params to use, or a string to parse query params from.</param>
            viewParams = (typeof viewParams == 'string' ? viewParams : _serializeParams(viewParams));

            if (_supportsHistoryApi) {
                history.pushState({}, null, '?' + viewParams);
                this._updateUrlState();
            }
        };

        Navigation.prototype._popState = function () {
            /// <summary>Goes back an entry in the navigation stack.</summary>
            if (_supportsHistoryApi) {
                history.back();
            }
        };

        Navigation.prototype._replaceState = function (viewParams) {
            /// <summary>Replaces the current set of view params without adding to the nav stack.</summary>
            viewParams = (typeof (viewParams) == "string") ? viewParams : _serializeParams(viewParams);

            if (_supportsHistoryApi) {
                history.replaceState({}, null, document.location.pathname + "?" + viewParams);
            } else {
                document.location.hash = viewParams;
            }

            this._updateUrlState();
        };
        return Navigation;
    })();

    function _serializeParams(viewParams) {
        /// <summary>Parses a view params object ( { a: "b", c: "d" } ) into a query param string (e.g. "a=b&c=d" ).</summary>
        var paramsString = "";
        var isFirstParam = true;

        for (var param in viewParams) {
            if (isFirstParam) {
                isFirstParam = false;
            } else {
                paramsString += "&";
            }

            paramsString += param + "=" + (viewParams[param] || "").encodeURIComponent();
        }

        return paramsString;
    }

    
    return Navigation;
});
