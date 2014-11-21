/**
 *
 * Created by wg on 14/11/19.
 */
var J = {
    a :function () {
        console.log('a');
    },
    test:function (a) {
        a();
    }
};
J.test(J.a);
