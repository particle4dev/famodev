Register = (function () {

    return function () {
        var list = {}, arr = [];
        this.set = function (name, obj) {
            if(list[name])
                throw new Error(name + ' is exists');
            list[name] = obj;
            arr.push(obj);
        };
        this.get = function (name) {
            if(_.isString(name))
                return list[name];
            return arr[name];
        };
        this.isSet = function (name) {
            return !!list[name];
        };
        this.length = function () {
            return arr.length;
        };
        this.forEach = function (func) {
            _.each(list, func);
        };
        this.remove = function (arg) {
            if(_.isString(arg)) {
                arr = _.without(arr, list[arg]);
                list[arg] = null;
                delete list[arg];
            }
            else if(_.isObject(arg)) {
                list = _.omit(list, function(value, key, object) {
                    return value === arg;
                });
                arr = _.without(arr, arg);
            }
            else if(_.isNumber(arg)) {
                if(this.length <= arg)
                    return;
                list = _.omit(list, function(value, key, object) {
                    return value === arr[arg];
                });
                arr = _.without(arr, arr[arg]);
            }
        }
    };
})();