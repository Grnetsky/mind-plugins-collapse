import { CollapseButton } from "../dom";
import {setLifeCycleFunc } from '@meta2d/core'
import {error} from "../utils";

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
        return (pen,args)=>{
            if(!isInit){
                // 获取mindBox插件对象
                if(!_toolBoxPlugin)_toolBoxPlugin = meta2d.penPlugins.find(i=>i.name === 'mindBox')
                if(!_toolBoxPlugin){
                    error('no find plugin-mind-core Plugin')
                    return
                }
                // 监听添加图元事件
                // meta2d.on('plugin:addNode',(data)=>{
                //     let {pen,newPen} = data
                //     if(pen.mind.children.length >= 1 && pen.mind.childrenVisible === false){
                //         collapseChildPlugin.extend(pen)
                //     }
                //     data = newPen
                //     collapseChildPlugin.init(data)
                // })
                meta2d.on('plugin:open',(pen)=>{
                    // TODO 打开图纸还未处理 -> 未处理对指定图元的
                    if(collapseChildPlugin.target.includes(pen.name) || collapseChildPlugin.target.includes(pen.tag) || pen.mind.collapse){
                        collapseChildPlugin.init(pen)
                    }
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
            }
            if(collapseChildPlugin.target.includes(target))return;
            collapseChildPlugin.target.push(target)
            if(addCallback) {
                meta2d.off('plugin:addNode', addCallback)
            }
            // 绑定为图元
            if(typeof target === 'object' && target.mind){
                collapseChildPlugin.init(target)
            }else {
                // 绑定为tag或者name
                addCallback = (data)=>{
                    let {pen,newPen} = data
                    if(collapseChildPlugin.target.includes(newPen.tag) ||collapseChildPlugin.target.includes(newPen.name) ){
                        if(pen.mind.children.length >= 1 && pen.mind.childrenVisible === false){
                            collapseChildPlugin.extend(pen)
                        }
                        collapseChildPlugin.init(newPen)
                    }
                }
                addCallback && meta2d.on('plugin:addNode',addCallback)
            }

        }
        })(),

    // 插件卸载执行函数
    uninstall(pen){

    },
    init(pen){
        pen.mind.collapse = {};
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

    // 监听生命周期
    combineLifeCycle(target){
        setLifeCycleFunc(target,'onMouseEnter',(targetPen)=>{
            if(targetPen.mind.children.length > 0){
                targetPen.mind.singleton.collapseButton.translatePosition(targetPen);
                targetPen.mind.singleton.collapseButton.show();
                if(targetPen.mind.childrenVisible){
                    targetPen.mind.singleton.collapseButton.setIcon()
                }
            }
        });

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