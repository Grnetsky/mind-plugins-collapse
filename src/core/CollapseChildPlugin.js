import {MindManager, setLifeCycleFunc} from "mind-diagram"
import { CollapseButton } from "../dom";

export let _toolBoxPlugin = null
export let CollapseChildPlugin = {
    name:'collapse',
    status: false,
    ctx:null,
    // 安装插件
    install(args){
        if(!_toolBoxPlugin)_toolBoxPlugin = MindManager.plugins.find(i=>i.name === 'toolBox')

        window.MindManager.pluginsMessageChannels.subscribe('addNode',(data)=>{
            let {pen,newPen} = data
            if(pen.mind.children.length >= 1 && pen.mind.childrenVisible === false){
                this.extend(pen)
            }
            data = newPen
            data.mind.collapse = {};
            if(!data.mind.singleton?.collapseButton){
              data.mind.singleton = {};
              data.mind.singleton.collapseButton = new CollapseButton((window).meta2d.canvas.externalElements.parentElement,{
              });
              CollapseChildPlugin.init(data);
            }
        });
        },

    // 插件卸载执行函数
    uninstall(){
    },
    init(pen){
        pen.mind.childrenVisible = true;
        pen.mind.allChildrenCount = 0;
        pen.mind.singleton.collapseButton.bindPen(pen.id);
        pen.mind.singleton.collapseButton.translatePosition(pen);
        CollapseChildPlugin.combineLifeCycle(pen);
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
        pen.mind.childrenVisible = false;
        let children = pen.mind.children || [];
        let allCount = children.length || 0;
        // if(!children || children.length === 0)return 0;
        // for(let i = 0 ; i< children.length;i++){
        //     let child = meta2d.store.pens[children[i]];
        //     // 设置子节点的可见性为false
        //     child.mind.visible = false;
        //     if(!child.mind.childrenVisible)child.mind.singleton.collapseButton?.hide()
        //
        //     // 设置相关line的可见性为false
        //     let line = child.connectedLines[0];
        //     (window).meta2d.setVisible((window).meta2d.findOne(line.lineId),false,false);
        //     // 计算子节点的个数
        //     allCount += CollapseChildPlugin.collapse(child,true);
        // }
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
            if(child && !child.mind.childrenVisible && !status){
                child.mind.singleton.collapseButton?.hide();
            }else if(child && !child.mind.childrenVisible && status){
                child.mind.singleton.collapseButton?.show();
            }
            if(recursion)this._controlChildButton(child,status,true)
        })
    },
    // collapse(pen,recursion = false){
    //     pen.mind.childrenVisible = false;
    //     this._collapse(pen)
    //     if(recursion){
    //         this.collapse(pen,true)
    //     }
    // },

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
            child.mind.visible = pen.mind.childrenVisible
            let line = child.connectedLines[0];
            (window).meta2d.setVisible((window).meta2d.findOne(line.lineId),pen.mind.childrenVisible,false);
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