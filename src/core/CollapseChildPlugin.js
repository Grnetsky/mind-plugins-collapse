import { CollapseButton } from "../dom";
import {deepClone, setLifeCycleFunc} from '@meta2d/core'
import {error} from "../utils";

let CONFIGS ={
    'style':'setStyle',
    'collapseIcon':'setCollapseIcon',
    'extendIcon':'setExtendIcon'
}
// 重做后元素被移除，深拷贝报错
let addCallback = null
export let _toolBoxPlugin = null
export let collapseChildPlugin = {
    name:'collapse',
    status: false,
    target:[],
    ctx:null,
    // 安装插件
    install:(()=>{
        let isInit = false
        let optionMap = new Map()

        return (pen,options)=>{
            if(!isInit){
                // 获取mindBox插件对象
                if(!_toolBoxPlugin)_toolBoxPlugin = meta2d.penPlugins.find(i=>i.name === 'mindBox')
                if(!_toolBoxPlugin){
                    error('not find plugin-mind-core Plugin')
                    return
                }

                meta2d.on('undo',(e)=>{
                    let { initPens } = e
                    initPens?.forEach(aPen=>{
                        let pen = meta2d.findOne(aPen.id)
                        if(isCollapsePen(pen)){
                            collapseChildPlugin.init(pen)
                            _toolBoxPlugin.update(meta2d.findOne(pen.mind.rootId))
                        }
                    })
                })

                meta2d.on('redo',(e)=>{
                    let { pens } = e
                    pens?.forEach(aPen=>{
                        let pen = meta2d.findOne(aPen.id)
                        if(isCollapsePen(pen)){
                            collapseChildPlugin.init(pen)
                            _toolBoxPlugin.update(meta2d.findOne(pen.mind.rootId))
                        }
                    })
                })
                // 打开图纸时触发
                meta2d.on('plugin:mindBox:open',(pen)=>{
                    // TODO 打开图纸还未处理 -> 未处理对指定图元的
                    let t = meta2d.findOne(pen.mind.rootId)
                    if(collapseChildPlugin.target.includes(t.name) || collapseChildPlugin.target.includes(t.tag) || pen.mind.collapse  && pen.mind.type==='node' ){
                        collapseChildPlugin.init(pen)
                    }
                })
                // 添加脑图梗节点
                meta2d.on('plugin:mindBox:addRoot',(pen)=>{
                    if(isCollapsePen(pen)){
                        collapseChildPlugin.init(pen);
                        pen.mind.collapse.config = optionMap.get(pen.tag) || optionMap.get(pen.name);
                    }
                    // 将配置写入根图元
                })
                isInit = true
            }
            let target = null
            let isTag = false
            if(pen.name){
                target = pen.name
            }else if(pen.tag){
                isTag = true
                target = pen.tag
            }else if(pen.pen){
                target = pen
            }else {
                return;
            }
            if(typeof target === 'object'){
                if(collapseChildPlugin.target.includes(target.id))return;
                collapseChildPlugin.target.push(target.id)
            }else {
                if(collapseChildPlugin.target.includes(target))return;
                collapseChildPlugin.target.push(target)
            }
            optionMap.set(target,deepClone(options || {}))
            if(addCallback) {
                meta2d.off('plugin:mindBox:addNode', addCallback)
            }
            // 绑定为图元
            if(typeof target === 'object' && target.mind){
                collapseChildPlugin.init(target)
            }else {
                // 绑定为tag或者name
                addCallback = (data)=>{
                    let { pen,newPen } = data
                    // pen.mind.mindboxOption = optionMap.get(.tag || pens[0].name);
                    if(isCollapsePen(newPen)){
                        if(pen.mind.children.length >= 1 && pen.mind.childrenVisible === false){
                            collapseChildPlugin.extend(pen)
                        }
                        collapseChildPlugin.init(newPen)
                        collapseChildPlugin.loadOptions(newPen)
                    }
                }
                addCallback && meta2d.on('plugin:mindBox:addNode',addCallback)
            }
        }
        })(),

    // 插件卸载执行函数
    uninstall(pen){

    },
    init(pen,config){
        pen.mind.collapse = {
        };
        pen.mind.singleton = {};
        pen.mind.singleton.collapseButton = new CollapseButton((window).meta2d.canvas.externalElements.parentElement,{
        });

        pen.mind.childrenVisible = true;
        pen.mind.allChildrenCount = 0;
        pen.mind.singleton.collapseButton.bindPen(pen.id);
        pen.mind.singleton.collapseButton.translatePosition(pen);
        collapseChildPlugin.combineLifeCycle(pen);
        pen.mind.singleton.collapseButton.hide();
    },
    __loadDefault(pen){

    },
    loadOptions(pen){
        // debugger
        if(isCollapsePen(pen)){
            let root = meta2d.findOne(pen.mind.rootId)
            let options = root.mind.collapse?.config
            if(typeof options !=='object')return
            this.__loadDefault()
            Object.keys(options).forEach(key=>{
                if(key in CONFIGS){
                    pen.mind.singleton.collapseButton[CONFIGS[key]](options[key]);
                }
            })
        }
    },
    // 监听生命周期
    combineLifeCycle(target){
        setLifeCycleFunc(target,'onMouseEnter',(targetPen)=>{
            if(targetPen.mind.children.length > 0){
                targetPen.mind.singleton.collapseButton.translatePosition(targetPen);
                targetPen.mind.singleton.collapseButton.show();
                if(targetPen.mind.childrenVisible){
                    targetPen.mind.singleton.collapseButton.setCollapseIcon()
                }
            }
        });

        setLifeCycleFunc(target,'onMouseUp',(target)=>{
            collapseChildPlugin.loadOptions(target)
        })

        setLifeCycleFunc(target,'onMouseLeave',(targetPen)=>{
            if(targetPen.mind.childrenVisible){
                targetPen.mind.singleton.collapseButton?.hide();
            }
        });

        setLifeCycleFunc(target,'onDestroy',(targetPen)=>{
            targetPen.mind.singleton.collapseButton?.hide();
            targetPen.mind.singleton.collapseButton?.destroy()
            targetPen.mind.singleton.collapseButton = undefined;
        });

        let moveDebounce = (targetPen)=>{
            targetPen.mind.singleton?.collapseButton?.translatePosition(targetPen);
            if(targetPen.mind.childrenVisible){
                targetPen.mind.singleton?.collapseButton?.hide();
            }
            // targetPen.mind.singleton?.collapseButton?.show();
        }
        setLifeCycleFunc(target,'onMove',moveDebounce);
    },
    getAllChildNumber(pen){
        if(!pen)return 0
        let num = 0
        let children = pen.mind.children
        children.forEach(i=>{
            let child = meta2d.store.pens[i]
            if(!child)return 0
            num += child.mind.children?.length || 0
            this.getAllChildNumber(child)
        })
        return  num
    },

    // 折叠函数
    collapse(pen){
        toolbox.hide()
        pen.mind.childrenVisible = false;
        let children = pen.mind.children || [];
        let allCount = children.length || 0;
        this._setVisible(pen,false,true)
        this._controlChildButton(pen,false)
        pen.mind.allChildrenCount = allCount;
        return allCount;
    },
    _controlChildButton(pen,status,recursion = true){
        if(!pen)return
        let children = pen.mind.children || [];
        children.forEach(i=>{
            let child = meta2d.store.pens[i];
            if(child && child.mind.childrenVisible && !status && !pen.mind.childrenVisible){
                child.mind.singleton.collapseButton?.hide();
            }else if(child && !child.mind.childrenVisible && pen.mind.childrenVisible && child.mind.visible && status){
                child.mind.singleton.collapseButton?.show();
            }else {
                child.mind.singleton.collapseButton?.hide();
            }
            if(recursion)this._controlChildButton(child,status,true)
        })
    },

    _setVisible(pen,visible,recursion = true){
        if(!pen)return
        let children = pen.mind.children || [];
        children.forEach(i=>{
            let child = meta2d.store.pens[i]
            if(!child)return
            child.mind.visible = visible
            let line = child.connectedLines[0];
            (window).meta2d.setVisible((window).meta2d.findOne(line.lineId),visible,false);
            (window).meta2d.setVisible(child,visible,false);
            if(recursion)this._setVisible(child,visible,true)
        })
    },
    // 展开函数
    extend(pen,recursion = true){
        pen.mind.childrenVisible = true;
        if(!pen)return
        this._setExtend(pen)
        this._controlChildButton(pen,true)
    },
    _setExtend(pen,recursion = true){
        if(!pen)return
        let children = pen.mind.children || [];
        children.forEach(i=>{
            let child = meta2d.store.pens[i]
            if(!child)return
            if(!pen.mind.childrenVisible)return;
            child.mind.visible = pen.mind.childrenVisible
            let line = child.connectedLines[0];
            meta2d.setVisible(meta2d.findOne(line.lineId),pen.mind.childrenVisible,false);
            meta2d.setVisible(child,pen.mind.childrenVisible,false)
            if(recursion)this._setExtend(child,true)
        })
    },
};

export function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            func.apply(context, args);
        }, wait);
    };
}

function isCollapsePen(pen){
    let root = meta2d.findOne(pen.mind?.rootId)
    return pen.mind.type === 'node' && (collapseChildPlugin.target.includes(root.id) || collapseChildPlugin.target.includes(root.name) || collapseChildPlugin.target.includes(root.tag))
}