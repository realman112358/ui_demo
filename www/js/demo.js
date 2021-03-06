/**
 *
 * Created by wg on 14/11/14.
 */
document.addEventListener('deviceready', onDeviceReady, false);
//cordova func
function log(){
    //notice,here console.log's this is console,if this is undefined,will invoke a exception
    console.log.apply(console, arguments);
}
function CommonFunc(){
    return {
        testSql:testSqlLite,
        fileHelper:new FileHelper(),
        dump:dump
    };
    //easy to debug on android phone
    function dump(obj){
        console.log(JSON.stringify(obj));
    }
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
            write:write,
            readDir:readDir
        };
        var _fs;
        function readDir(dirPath, success, fail){
            _fs.root.getDirectory(dirPath, {create:false, exclusive:false}, function(dirEntry){
                var dirReader = dirEntry.createReader();
                dirReader.readEntries(function(dirs){
                    success(dirs);
                }, fail);
            },function(e){
                fail(e);
            });

        }
        function default_fail(error){
            console.log("failed" + error.code)
        }
        function init(success, fail){
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs){
               _fs= fs;
               console.log("fs init");
                success();
            }, fail);
        }
        //support recursive mode(mkdir 1/2/3)
        function mkdir(dir, success,fail){
            var dirs =  dir.split("/").reverse();
            var root = _fs.root;
            var createDir = function(dir){
                console.log("create dir:"+dir);
                root.getDirectory(dir, {create:true, exclusive:false}, function(entry){
                    console.log("dir created:"+entry.fullPath);
                    root = entry;
                    if(dirs.length>0){
                        createDir(dirs.pop());
                    }else{
                        console.log("all dir created");
                        success(entry);
                    }
                },fail);
            };
            createDir(dirs.pop());
        }
        //is Write:whether to create file if not exist
        function getPath(path, success,fail, isCreate){
            isCreate = isCreate || false;
            console.log("enter getpath");
            var dirs = path.split("/");
            var dirHandle;
            var fileHandle;
            if(dirs.length == 1){
                console.log("no dir file");
                _fs.root.getFile(path, {create:isCreate, exclusive:false}, handle_file,fail)
            }else{
                var real_dir = dirs.slice(0, dirs.length-1).join('/');
                var real_path = dirs[dirs.length-1];
                console.log("dir:"+real_dir+" path:"+real_path);
                _fs.root.getDirectory(real_dir, {create:isCreate, exclusive:false}, function(dir){
                    dir.getFile(real_path, {create:isCreate, exclusive:false}, handle_file, fail);
                }, fail);
            }
            function handle_file(file_handle){
                console.log("get file");
                success(file_handle);
            }
        }
        function read(path, success, fail){
            getPath(path, function(file){
                file.file(function(file){
                    var reader = new FileReader();
                    console.log("create reader");
                    reader.onloadend = function (evt) {
                        console.log("read fin");
                        success(evt.target.result);
                    };
                    reader.readAsText(file);
                }, fail);
            }, fail, false);
        }
        //default append mode
        function write(path, data, success, fail){
            console.log("enter write");
            getPath(path, function(file){
                file.createWriter(function(writer){
                   writer.onwrite = function(evt){
                      console.log("write done");
                      success();
                   };
                   writer.seek();
                   writer.write(data);
                }, fail);
            }, fail, true);
        }
    }
}
//cordova func
function onDeviceReady() {
    console.log("device ready");
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
    this.init = function(){
        log('chart init');
        $('#chart_choose_date').tap(function(){
            J.popup({
                html : '<div id="popup_calendar"></div>',
                pos : 'center',
                backgroundOpacity : 0.4,
                showCloseBtn : false,
                onShow : function(){
                    new J.Calendar('#popup_calendar',{
                        date : new Date(),
                        onSelect:function(date){
                            $('#chart_title').text(date);
                            J.closePopup();
                            update_chart(date);
                        }
                    });
                }
            });
        });
        function update_chart(date){
            var dates = date.match(/(\d{4})-(\d{2})-(\d{2})/);
            var year = dates[1];
            var month = dates[2];
            var day = dates[3];
            log(year,month,day);
            if(!J.isWebApp) {
                //android 环境，读sdcard卡
                var CF = new CommonFunc();
                CF.fileHelper.init(function () {
                    var path = "wg/data/" + year + "/" + month + "/" + day;
                    CF.fileHelper.read(path, function (data) {
                        log("file data is:"+data);
                        //important!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                        //to be continued
                        //do something to make data to datases;
                        var new_data = data;
                        draw_chart_day(new_data);
                    }, function () {
                        log(path + ":read failed");
                        J.showToast( 'sorry:当天没有数据', 'error');
                    });
                });
            }else{
                var datasets = [];
                for (var i = 0; i < 24; i++) {
                    datasets.push((Math.random() + 36).toFixed(1));
                }
                draw_chart_day(datasets);
            }
        }
        function draw_chart_day(data){
            var option = {
                labels : [],
                datasets : [
                    {
                        name : '体温',
                        color : "#72caed",
                        pointColor : "#95A5A6",
                        pointBorderColor : "#fff",
                        data : data
                    }
                ]
            };
            for(var i=0;i<24;i++){
                option.labels.push(i.toString());
            }
            //重新设置canvas大小
            $chart = $('#dynamic_line_canvas');
            var wh = App.calcChartOffset();
            $chart.attr('width',wh.width).attr('height',wh.height-30);
            new JChart.Line(option,{
                id : 'dynamic_line_canvas',
                datasetGesture : true,
                datasetOffsetNumber : 12
            }).draw(true);
            line.draw();
        }
    };
});


