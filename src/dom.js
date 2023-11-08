import {CollapseChildPlugin} from "../index";
import {toolBoxPlugin} from "mind-plugins-core";

export class CollapseButton {
    icon = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" t="1695196647299" class="icon" viewBox="0 0 1024 1024" version="1.1" p-id="15005" width="200" height="200"><path d="M353.96380445 470.37781333c-28.69589333 26.00504889-28.30791111 68.80711111 0.94776888 94.40711112l329.83722667 288.60643555c9.45834667 8.27619555 23.83416889 7.31704889 32.11036445-2.14129778s7.31704889-23.83416889-2.14129778-32.11036444l-329.83722667-288.60643556c-8.78023111-7.68227555-8.87921778-18.71075555-0.35612445-26.43399111l330.48803556-299.50520889c9.31157333-8.43889778 10.02040889-22.82951111 1.58037334-32.14222222-8.43889778-9.31157333-22.82951111-10.02040889-32.14222223-1.58037333l-330.48803555 299.50520888z" p-id="15006" fill="#ffffff"/></svg>';
    count = 0;
    constructor(parentHtml,style = {}) {
        this.box = document.createElement('div');
        this.box.style.backgroundColor = '#4480F9';
        this.box.style.borderRadius = '50%';
        this.box.style.boxShadow = '0px 6px 20px rgba(25,25,26,.06), 0px 2px 12px rgba(25,25,26,.04)';
        this.box.style.width = '14px';
        this.box.style.height = '14px';
        // this.box.style.padding = '2px';
        this.box.className = 'hide_button';
        this.box.style.display = 'none';
        this.box.style.zIndex = '999';
        this.box.style.cursor = 'pointer';
        this.box.style.display = 'flex';
        this.box.style.justifyContent = 'center';
        this.box.style.alignItems = 'center';
        this.box.style.color = "#fff";
        this.box.style.fontSize = '400';
        this.setStyle(this.box,style);
        parentHtml.appendChild(this.box);
    }
    onClick(){
        if(this.mind.childrenVisible){
            let count = CollapseChildPlugin.collapse(this);
            this.mind.singleton.collapseButton.setNumber(count);

            // 从当前节点处更新
            toolBoxPlugin.update(meta2d.findOne(this.mind.rootId));
        }else{
            CollapseChildPlugin.extend(this);
            this.mind.singleton.collapseButton.setIcon();
            toolBoxPlugin.update(meta2d.findOne(this.mind.rootId));
        }
    }
    setIcon(){
        this.box.innerHTML = this.icon;
    }
    // 折叠子项 level为折叠层数 默认则折叠所有子项
    setStyle(box, style){
        Object.keys(style).forEach(i=>{
            box.style[i] = style[i];
        });
    }
    setNumber(_number){
        this.box.innerHTML = _number;
    }
    hide(){
        this.box.style.visibility = 'hidden';
    }
    show(){
        this.box.style.visibility = 'visible';
    }
    bindPen(penId){
        let pen = meta2d.findOne(penId);
        this.penId = penId;
        this.box.onclick = this.onClick.bind(pen);
        if(pen.mind.childrenVisible){
            this.box.innerHTML = this.icon;
        }else{
            this.box.innerHTML = pen.mind.allChildrenCount;
        }
    }
    translatePosition(pen,position = 'right'){
        this.hide();
        const store = pen.calculative.canvas.store;
        const worldRect = pen.calculative.worldRect;
        this.box.style.position = 'absolute';
        this.box.style.outline = 'none';
        let pos = {
            x:"-999",
            y:"-999"
        };
        switch (position) {
            case 'right':
                pos.x = worldRect.x + store.data.x + worldRect.width + 6 + 'px';
                pos.y = worldRect.y + store.data.y + worldRect.height / 2 + 'px';
                break;
            case 'left':
            case 'top':
            case 'bottom':
        }
        this.box.style.left = pos.x;
        this.box.style.top =  pos.y;
        this.box.style.transform = "translateY(-50%)";
        this.box.style.userSelect = 'none';
        // this.show();
    }

}
