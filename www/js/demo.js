/**
 *
 * Created by wg on 14/11/14.
 */
document.addEventListener('deviceready', onDeviceReady, false);
//cordova func
function CommonFunc(){
    return {
        testSql:testSqlLite,
        fileHelper:new FileHelper()
    };
    function testSqlLite(){
        var db = window.sqlitePlugin.openDatabase("Database", "1.0", "Demo", -1);
        db.transaction(function (tx) {
            tx.executeSql('DROP TABLE IF EXISTS test_table');
            tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data text, data_num integer)');

            tx.executeSql("INSERT INTO test_table (data, data_num) VALUES (?,?)", ["test", 100], function (tx, res) {
                console.log("insertId: " + res.insertId + " -- probably 1");
                console.log("rowsAffected: " + res.rowsAffected + " -- should be 1");

                tx.executeSql("select count(id) as cnt from test_table;", [], function (tx, res) {
                    console.log("res.rows.length: " + res.rows.length + " -- should be 1");
                    console.log("res.rows.item(0).cnt: " + res.rows.item(0).cnt + " -- should be 1");
                });
            }, function (e) {
                console.log("ERROR: " + e.message);
            });
        });
    }
    function FileHelper(){
        return {
            init:init,
            mkdir:mkdir,
            read:read,
            write:write
        };

        var _fs;
        function fail(error){
            console.log("failed" + error.code)
        }
        function init(callback){
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs){
               _fs= fs;
               console.log("fs init");
                callback();
            }, fail);
        }
        //support recursive mode(mkdir 1/2/3)
        function mkdir(dir, success){
            var dirs =  dir.split("/").reverse();
            var root = _fs.root;
            var createDir = function(dir){
                console.log("create dir"+dir);
                root.getDirectory(dir, {create:true, exclusive:false}, function(entry){
                    console.log("dir created "+entry.fullPath);
                    root = entry;
                    if(dirs.length>0){
                        createDir(dirs.pop());
                    }else{
                        console.log("all dir created");
                        success(entry);
                    }
                }, function(){
                   console.log("failed to create dir:"+dir);
                });
            }
            createDir(dirs.pop());
        }
        function getPath(path, callback){
            console.log("enter getpath");
            var dirs = path.split("/");
            var dirHandle;
            var fileHandle;
            if(dirs.length == 1){
                console.log("no dir file");
                _fs.root.getFile(path, {create:true, exclusive:false}, handle_file,fail)
            }else{
                var real_dir = dirs.slice(0, dirs.length-1).join('/');
                var real_path = dirs[dirs.length-1];
                console.log("dir "+real_dir+" path "+real_path);
                _fs.root.getDirectory(real_dir, {create:true, exclusive:false}, function(dir){
                    dir.getFile(real_path, {create:true, exclusive:false}, handle_file, fail);
                }, fail);
            }
            function handle_file(file_handle){
                console.log("get file");
                callback(file_handle);
            }
        }
        function read(path, callback){
            getPath(path, function(file){
                file.file(function(file){
                    var reader = new FileReader();
                    console.log("create reader");
                    reader.onloadend = function (evt) {
                        console.log("read fin");
                        callback(evt.target.result);
                    };
                    reader.readAsText(file);
                }, fail);
            });
        }
        //default append mode
        function write(path, data, callback){
            console.log("enter write");
            getPath(path, function(file){
                file.createWriter(function(writer){
                   writer.onwrite = function(evt){
                      console.log("write done");
                      callback();
                   };
                   writer.seek();
                   writer.write(data);
                }, fail);

            });
        }
    }
}
//cordova func
function onDeviceReady() {
    console.log("device ready");
    var CF = new CommonFunc();
    CF.fileHelper.init(function(){
            console.log("fs init");
            CF.fileHelper.mkdir("test/test", function(entry){
                CF.fileHelper.write("test/test/test.txt", "1234", function(){
                    console.log("write done");
                    CF.fileHelper.read("test/test/test.txt", function(data){
                        console.log(data);
                    });
                });
            });
        }
    );

    navigator.splashscreen.hide();
    //注册后退按钮
    document.addEventListener("backbutton", function (e) {
        if(J.hasMenuOpen){
            J.Menu.hide();
        }else if(J.hasPopupOpen){
            J.closePopup();
        }else{
            var sectionId = $('section.active').attr('id');
            if(sectionId == 'index_section'){
                J.confirm('提示','是否退出程序？',function(){
                    navigator.app.exitApp();
                });
            }else{
                window.history.go(-1);
            }
        }
    }, false);
    App.run();
}
var App = (function(){
    var pages = {};
    var run = function(){
        console.log("app run");
        $.each(pages,function(k,v){
            var sectionId = '#'+k+'_section';
            $('body').delegate(sectionId,'pageinit',function(){
                v.init && v.init.call(v);
            });
            $('body').delegate(sectionId,'pageshow',function(e,isBack){
                //页面加载的时候都会执行
                v.show && v.show.call(v);
                //后退时不执行
                if(!isBack && v.load){
                    v.load.call(v);
                }
            });
        });
        J.Transition.add('flip','slideLeftOut','flipOut','slideRightOut','flipIn');
        //basehtml path is demohtml, override default html/
        Jingle.launch({basePagePath:'demohtml/'});
    };
    var page = function(id,factory){
        return ((id && factory)?_addPage:_getPage).call(this,id,factory);
    }
    var _addPage = function(id,factory){
        pages[id] = new factory();
    };
    var _getPage = function(id){
        return pages[id];
    }
    //动态计算chart canvas的高度，宽度，以适配终端界面
    var calcChartOffset = function(){
        return {
            height : $(document).height() - 44 - 30 -60,
            width : $(document).width()
        }

    }
    return {
        run : run,
        page : page,
        calcChartOffset : calcChartOffset
    }
}());
if(J.isWebApp){
    $(function () {
        App.run();
    })
}
App.page('todo', function(){
    this.init = function(){
        console.log("todo init");
        var todo_json = window.localStorage.getItem("tododata");
        var todo_data = JSON.parse(todo_json);
        if(!todo_data){
            todo_data = [];
        }
        todo_data && J.tmpl($("#todo_data"), 'tpl_todo', todo_data, 'replace');
        $("#todo_save").tap(function(){
            var title = $("#todo_title").val();
            var detail = $("#todo_detail").val();
            J.confirm('check', 'are you sure?\r\ntitle:'+title+"\r\ndetail:"+detail,
                function(){
                    var new_todo = {title:title, detail:detail};
                    todo_data.push(new_todo);
                    var todo_json = JSON.stringify(todo_data);
                    window.localStorage.setItem("tododata", todo_json);
                    console.log("add data to localstorage");
                    J.tmpl($("#todo_data"),'tpl_todo',[new_todo],'add');
                    J.showToast("ok", 'success', 1000);
                },
                function(){
                    J.showToast("cancled", 'success', 1000);
                }
                );
        });
    };
});
App.data = [];
App.page('rss', function(){
    this.init = function() {
        //var url = "http://192.168.0.110/web/Jingle-master/demo/proxy.php";
        var url = "http://jianshu.milkythinking.com/feeds/recommendations/notes";
        J.Popup.loading();
        console.log("rss init");

        $.get(url, function (data) {
            if(!data){
                return ;
            }
            //var xml_data = new DOMParser().parseFromString(data, "text/xml");
            var js = new X2JS();
            var json = js.xml_str2json(data);
            var json_data = json.rss.channel.item;
            App.data = json_data.concat();
            //var json_data = $(data);
            J.showToast('succeed', 'success');
            J.tmpl($("#rss_channel1_data"), 'tpl_rss', json_data, 'replace');
            J.Popup.close();
        });
        J.Refresh({
            selector: "#rss_channel1_article",
            type: "pullDown",
            pullText: 'loading',
            releasetext: 'loading',
            refreshTip: 'loaded',
            callback: function () {
                var scroll = this;
                $.get(url, function (data) {
                    scroll.refresh();
                    var json_data = JSON.parse(data);
                    J.showToast('succeed', 'success');
                    J.tmpl($("#rss_channel1_data"), 'tpl_rss', json_data, 'add');
                });
            }
        });
    }
});
App.page('detail', function(){
    this.init = function() {
        console.log("detail init");
    }
    this.show = function(){
        console.log('show');
        var url = window.location.href;
        var id = url.split("=")[1];
        var content = App.data[id].description;
        $("#rss_detail_content").html(content);
    }
});
App.page('sqltest', function(){
    this.init = function() {
        console.log("sql_test init");
        var db = window.sqlitePlugin.openDatabase({name:"my.db"});
        db.transaction(function(tx){
            tx.executeSql('create table if not exists test(id integer primary key,data text');
                tx.executeSql('insert into test values(?,?)', [undefined, "test" ], function(tx, res){
                    console.log("insert ok");
                    tx.executeSql("select * from test", [], function(tx, res){
                        console.log(res.rows.length);
                        for(var i = 0; i< res.rows.length; i++){
                            console.log(res.rows.item[i].id, res.rows.item[i].data);
                        }
                    });

                });
            }, function(e){
                console.log("error:", e.message);
            });

        J.tmpl($("#sqltest_data"), 'tpl_sqltest', data, 'replace');

    }
});
App.page('chart',function(){
    var pause = false,$chart;
    var datasets = [65,59,90,81,56,55,40,20,3,20,10,60];
    var data = {
        labels : ["一月","二月","三月","四月","五月","六月","七月",'八月','九月','十月','十一月','十二月'],
        datasets : [
            {
                name : '体温',
                color : "#72caed",
                pointColor : "#95A5A6",
                pointBorderColor : "#fff",
                data : datasets
            }
        ]
    }

    this.init = function(){
        //重新设置canvas大小
        $chart = $('#dynamic_line_canvas');
        var wh = App.calcChartOffset();
        $chart.attr('width',wh.width).attr('height',wh.height-30);
        var line = new JChart.Line(data,{
            id : 'dynamic_line_canvas'
        });
        line.draw();
        refreshChart(line);
        $('#pause_dynamic_chart').on('tap',function(){
            pause = !pause;
            $(this).text(pause?'继续':'暂停');
        })
    }

    function refreshChart(chart){
        setTimeout(function(){
            if(!pause){
                datasets.shift();
                datasets.push(Math.floor(Math.random()*100));
                chart.load(data);
            }
            refreshChart(chart);
        },1000);
    }
});



