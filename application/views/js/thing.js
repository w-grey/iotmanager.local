/**
 * Created by Sergey on 16.11.2016.
 */

"use strict";
//делаем заглавные буквы
/*$('h1,h2').each(function (index, element) {
    var text=element.innerHTML;
    var l=text[0].toUpperCase();
    element.innerHTML=l+text.substring(1);
});*/
//получаем action_id
/*var actionList=[];
 $(".item").each(function (index, element) {
 actionList.push(element.getAttribute("id"));
 });
 var strJson=JSON.stringify(actionList);
 console.log("strJson: "+strJson);


 //post запрос на текущие данные
 $.post("getdata",{actions:strJson},onAjaxSuccess,'json');
 var timerId = setInterval(function() {
 $.post("getdata",{actions:strJson},onAjaxSuccess,'json');
 }, 10000);
 function onAjaxSuccess(data) {
 for (var i=0;i<data.length;i++){
 $("#"+data[i]['action_id']+" .output").text(data[i]['action_value'])
 }
 }

 //Управление устройством
 $("input[type='submit']").on('click',function (e) {
 var action_id=this.getAttribute('name').substr(7);
 var input=$("[name='input_"+action_id+"']");
 var value=input.val();
 input.val("");//look here, it's temporary!!!!!!!!!!!!!!!
 var arr={};
 arr['action_id']=action_id;
 arr['value']=value;
 $.post("setaction",{newData:JSON.stringify(arr)},function (data) {
 console.log(data);
 $.post("getdata",{actions:strJson},onAjaxSuccess,'json');

 })
 });
 */

//Описание сущностей----------------------------------------------------------------------------------
class Item{
    constructor(data,owner){
        this.owner=owner;
        if ("color" in data) this.color=data.color;
        else this.color=null;
        this.format=owner.format;
            switch (this.format) {
                case "list":
                    if (!data.name) throw new Error("There is no name in range. Action:"+owner.name);
                    this.name = data.name;
                    this.from=null;
                    this.to=null;
                    break;
                case "number":
                    let from=null;
                    let to=null;
                    if ("from" in data){
                        from=+data.from;
                    }
                    if ("to" in data){
                        to=+data.to;
                    }
                    if (!(from||to)) throw new Error("There is no from and to in range. Action:"+owner.name);
                    if (!from) from="infinity";
                    if (!to) to="infinity";
                    this.from=from;
                    this.to=to;
                    this.name=null;
                    break;
                case "date":
                    let fromDate=undefined;
                    let toDate=undefined;
                    if ("from" in data){
                        let params=data.from.split(",");
                        fromDate=new Date(params[0],params[1],(params[2]==undefined?null:params[2]),(params[3]==undefined?null:params[3]),(params[4]==undefined?null:params[4]),(params[5]==undefined?null:params[5]),(params[6]==undefined?null:params[6]));

                    }
                    if ("to" in data){
                        let params=data.from.split(",");
                        toDate=new Date(params[0],params[1],(params[2]==undefined?null:params[2]),(params[3]==undefined?null:params[3]),(params[4]==undefined?null:params[4]),(params[5]==undefined?null:params[5]),(params[6]==undefined?null:params[6]));
                    }
                    if (!(fromDate||toDate)) throw new Error("There is no from and to in range. Action:"+owner.name);
                    if (!fromDate) fromDate="infinity";
                    if (!toDate) toDate="infinity";
                    this.from=fromDate;
                    this.to=toDate;
                    this.name=null;
                    break;
            }


    }
    isInRange(val){
        return false;
    }
}

class MainItem extends Item{
    constructor(data,owner){
        super(data,owner);
        if ("activeActions" in data) this.activeActions=data.activeActions.split(",");
        else this.activeActions=null;
    }
}

class SupportItem extends Item{
    constructor(data,owner){
        super(data,owner);
        if ("isDisactivator" in data) this.isDisactivator=data.isDisactivator=="true";
        else this.isDisactivator=false;
        if ("description" in data) this.description=data.description;
        else this.description=null;
    }
}

class Action{
    constructor(data,owner) {
        this.owner = owner;
        this.name = data.name;
        this.format = data.format;
        this.isChangeable = data.isChangeable == "true";
        this.submitName = data.submitName;
        this.isNeedStatistics = data.isNeedStatistics == "true";
        this.rank = data.rank;
        this.id = data.id;
        this.description = null;
        if ("description" in data) this.description = data.description;
    }

}

class SupportAction extends Action{
    constructor(data,owner){
        super(data,owner);
        this.isDisactivator=data.isDisactivator=="true";
        this.isIndividual=data.isIndividual=="true";
        this.range=null;
            if ("range" in data) {
                let r = [];
                for (let i = 0; i < data.range.length; i++) {
                    r.push(new SupportItem(data.range[i], this))
                }
                this.range = r;
            }

    }
    draw(){

    }
}

class MainAction extends Action{
    constructor(data,owner){
        super(data,owner);
        this.range=null;
        if ("range" in data){
            let r=[];
            for (let i=0;i<data.range.length;i++){
                r.push(new MainItem(data.range[i],this))
            }
            this.range=r;
        }
        this.supportActions=null;
        if ("support" in data){
            let actions=[];
            for (let i=0;i<data.support.length;i++){
                actions.push(new SupportAction(data.support[i],this));
            }
            this.supportActions=actions;
        }
    }
    //look here!!!!!!!!!!!!-------------------------------------------------------
    draw(){
        let mainActionDom=$("<div class='mainAction' id='mainAction_"+this.id+"'>" +
            "<h3>"+this.name+"</h3></div>");
        if (this.description!=null) mainActionDom.append("<div class='description'>"+this.description+"</div>");
        mainActionDom.append("<div class='value'></div>");
        if (this.isChangeable){
            let from=null;
            let to=null;
            if (this.range!=null) {
                from=this.range[0].from;
                to=this.range[0].to;
            }
            switch (this.format){
                case "number":
                    mainActionDom.append("<p>Введите новое значение"+(from||to?" в диапозоне":"")+(from?" от "+from:"")+(to?" до"+to:"")+":</p>");
                    break;
                case "list":
                    break;
            }
        }
    }
}

class ActionGroup{
    constructor(data,owner){
        this.owner=owner;
        this.name=null;
        if ("name" in data) this.name=data.name;
        this.id=data.id;
        this.rank=data.rank;
        let actions=[];
        for (let i=0;i<data.actions.length;i++){
            actions.push(new MainAction(data.actions[i],this));
        }
        this.actions=actions;
    }
    draw(){
        let actionGroupDom=$("<div class='actionGroup' id='actionGroup_"+this.id+"'></div>");
        if (this.name!=null){
            actionGroupDom.append("<h2>"+this.name+"</h2>");
        }
        return actionGroupDom;

    }
}

class Device{
    constructor(data){
        this.id=data.id;
        this.name=data.name;
        this.group=data.thingGroup;
        this.updateTime=data.updateTime;
        let actGroups=[];
        for (let i=0;i<data.actionGroups.length;i++){
            actGroups.push(new ActionGroup(data.actionGroups[i],this));
        }
        this.actionGroups=actGroups;
    }
    draw(){
        return $("<div class='device' id='device_"+this.id+"'></div>");
    }


}

class Theme{
    constructor(){
        this.name="Simple";
        this.allLines=1;
        this.algorithm="simple";
        this.rules=null;
    }
}

class DrawManager{
    constructor(device){
        this.device=device;
        this.themes=[];
        this.themes.push(new Theme());
        this.activeTheme=this.themes[0];
    }
    draw(){
        $("h1.device_name").text(this.device.name);
        let groups=this.device.actionGroups;
        groups.sort(this.rankSort);
        for (let i=0;i<groups.length;i++){
            groups[i].actions.sort(this.rankSort);
            for (let l=0;l<groups[i].actions.length;l++){
                if (groups[i].actions[l].supportActions!=null) {
                    groups[i].actions[l].supportActions.sort(this.rankSort);
                }
            }
        }
        this[this.activeTheme.algorithm+"Algorithm"]();
        $('h1,h2,h3').each(function (index, element) {
            var text=element.innerHTML;
            var l=text[0].toUpperCase();
            element.innerHTML=l+text.substring(1);
        });
    }
    simpleAlgorithm(){
        let deviceDom=this.device.draw();
        deviceDom.css({
            "width":"900px",
            "height":"100%",
            "margin-left":"auto",
            "margin-right":"auto",
            "backgroundColor":"black"
        });
        let section=$("section.container");
        section.append(deviceDom);

    }
    rankSort(a,b){
        return (a.rank-b.rank);
    }
}


//Начало работы программы---------------------------------------------------------------
let dataFromJson=JSON.parse($("#data_in_json").html());
let device=new Device(dataFromJson);
let drawManager=new DrawManager(device);
drawManager.draw();