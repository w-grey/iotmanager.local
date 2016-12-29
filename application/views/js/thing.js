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
    draw(){
        let actionDom=$("<div><h3>"+this.name+"</h3></div>");
        if (this.description!=null) actionDom.append("<div class='description'>"+this.description+"</div>");
        actionDom.append("<p>Текущее значение:</p><div class='value'></div>");
        if (this.isChangeable){
            let from=null;
            let to=null;
            if (this.range!=null) {
                from=this.range[0].from;
                to=this.range[0].to;
            }
            switch (this.format){
                case "number":
                    actionDom.append("<p>Введите новое значение"+(from||to?" в диапозоне":"")+(from?" от "+from:"")+(to?" до"+to:"")+":</p>");
                    actionDom.append("<input name='newValue' type='text'>");
                    break;
                case "list":
                    actionDom.append("<p>Выберите новое значение:</p>");
                    let selectDom=$("<select name='newValue'></select>");
                    for (let i=0;i<this.range.length;i++){
                        selectDom.append($("<option value='"+i+"'>"+this.range[i].name+"</option>"));
                    }
                    actionDom.append(selectDom);
                    break;
                case "date":
                    break;
            }
            return actionDom;
        }
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
        let supportActionDom=super.draw();
        supportActionDom.attr({
            "class":"supportAction",
            "id":"supportAction_"+this.id
        });
        if (this.isChangeable&&this.isIndividual){
            supportActionDom.append("<div class='submit'><input type='submit' value='"+(this.submitName?this.submitName:"Отправить")+"'></div>")
        }
        return supportActionDom;
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
    draw(){
        let mainActionDom=super.draw();
        mainActionDom.attr({
            "class":"mainAction",
            "id":"mainAction_"+this.id
        });
        mainActionDom.append("<div class='support'></div>");
        if (this.isChangeable){
            mainActionDom.append("<div class='submit'><input type='submit' value='"+(this.submitName?this.submitName:"Отправить")+"'></div>")
        }
        return mainActionDom;
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
        actionGroupDom.append("<div class='actionContainer'></div>")
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
        this.allLines=2;
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
        let containerWidth=document.documentElement.clientWidth-200;
        deviceDom.css({
            "width":containerWidth+"px",
            "height":"100%",
            "margin-left":"auto",
            "margin-right":"auto",
            "border-left":"1px solid white",
            "border-right":"1px solid white",
            "color":"white",
            "font-size":"20px"
        });
        let actionGroups=this.device.actionGroups;

        for (let i=0;i<actionGroups.length;i++){
            let actionGroupDom=actionGroups[i].draw();
            actionGroupDom.find("h2").css("marginBottom","30px");
            let actionContainerDom=actionGroupDom.find("div.actionContainer");
            actionContainerDom.css({
                "display":"flex",
                "flexWrap":"wrap",
                "justifyContent":"space-around",
                "width":"100%"
            });
            if (actionGroups.length!=1){
                actionGroupDom.css("border","1px solid black");
            }
            let actions=actionGroups[i].actions;
            let actionWidth=Math.floor(containerWidth/this.activeTheme.allLines)-this.activeTheme.allLines*8;
            for (let l=0;l<actions.length;l++){
                let actionDom=actions[l].draw();
                actionDom.css({
                    "width":actionWidth+"px",
                    "border":"1px solid white",
                    "padding":"5px"
                });
                actionDom.find("div.value").css({
                    "height":"30px",
                    "background":"grey"
                });
                let supportActions=actions[l].supportActions;
                if (supportActions!=null) {
                    let supportContainerDom=actionDom.find("div.support");
                    supportContainerDom.css({
                        "display":"flex",
                        "flexWrap":"wrap",
                        "justifyContent":"space-around",
                        "border":"1px solid grey"
                    });
                    let supportActionWidth=Math.floor(actionWidth/supportActions.length);
                    if (supportActionWidth<250) {
                        let w = Math.floor(actionWidth / 250);
                        supportActionWidth = Math.floor(actionWidth / w)-w*8;
                    }
                    else supportActionWidth-=supportActions.length*8;
                    alert(supportActionWidth);
                    for (let m = 0; m < supportActions.length; m++) {
                        let supportActionDom = supportActions[m].draw();
                        supportActionDom.css({
                            "width": supportActionWidth + "px",
                            "border": "1px solid grey",
                            "padding":"5px"
                        });
                        supportActionDom.find("div.value").css({
                            "height": "30px",
                            "background": "grey"
                        });
                        supportContainerDom.append(supportActionDom);
                    }
                }
                actionContainerDom.append(actionDom);
            }
            deviceDom.append(actionGroupDom);
        }
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