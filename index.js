import {setLifeCycleFunc,getPlugin} from "mind-diagram"
import {CollapseButton} from "./src/dom";
import {toolBoxPlugin} from "../mind-plugins-core";
export let CollapseChildPlugin = {
  name:'hideChildren',
  status: false,
  // 安装插件
  install(args){
    window.MindManager.pluginsMessageChannels.subscribe('addNode',(data)=>{
      if(!data.mind.singleton?.collapseButton){
        data.mind.singleton = {};
        data.mind.singleton.collapseButton = new CollapseButton((window).meta2d.canvas.externalElements.parentElement,{
        });
        CollapseChildPlugin.init(data);
      }
      this.extend(meta2d.findOne(data.mind.preNodeId))
      toolBoxPlugin.update(meta2d.findOne(data.mind.rootId))
    });

    // 跟随移动
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
      }
    });

    setLifeCycleFunc(target,'onMouseLeave',(targetPen)=>{
      if(targetPen.mind.childrenVisible){
        targetPen.mind.singleton.collapseButton?.hide();
      }
    });

    setLifeCycleFunc(target,'onDestroy',(targetPen)=>{
        targetPen.mind.singleton.collapseButton.hide();
        targetPen.mind.singleton.collapseButton = undefined;
    });

    let moveDebounce = debounce((targetPen)=>{
      targetPen.mind.singleton?.collapseButton?.translatePosition(targetPen);
      if(targetPen.mind.childrenVisible){
        targetPen.mind.singleton?.collapseButton?.hide();
      }
        // targetPen.mind.singleton?.collapseButton?.show();
    },200);
    setLifeCycleFunc(target,'onMove',moveDebounce);
  },
  // 折叠函数
  collapse(pen){
    pen.mind.childrenVisible = false;
    let children = pen.mind.children;
    let allCount = children.length;
    if(!children || children.length === 0)return 0;
    for(let i = 0 ; i< children.length;i++){
      let child = children[i];
      // 设置子节点的可见性为false
      child.mind.visible = false;

      // 设置相关line的可见性为false
      let line = child.connectedLines[0];
      (window).meta2d.setVisible((window).meta2d.findOne(line.lineId),false,false);
      // 计算子节点的个数
      allCount += CollapseChildPlugin.collapse(child);
    }
    pen.mind.allChildrenCount = allCount;
    return allCount;
  },
  // 展开函数
  extend(pen,recursion = true){
    pen.mind.childrenVisible = true;
    let children = pen.mind.children;
    if(!children || children.length === 0)return;

    // 让所有子集都展开
    for(let i = 0 ; i< children.length;i++){
      let child = children[i];
      child.mind.visible = true;
      let line = child.connectedLines[0];
      (window).meta2d.setVisible((window).meta2d.findOne(line.lineId),true,false);
      if(recursion)CollapseChildPlugin.extend(child);
    }
  }
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