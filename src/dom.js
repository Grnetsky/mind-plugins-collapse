import {collapseChildPlugin} from "./core/CollapseChildPlugin";
import {_toolBoxPlugin} from "./core/CollapseChildPlugin";

export class CollapseButton {
    // icon = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" t="1695196647299" class="icon" viewBox="0 0 1024 1024" version="1.1" p-id="15005" width="200" height="200"><path d="M353.96380445 470.37781333c-28.69589333 26.00504889-28.30791111 68.80711111 0.94776888 94.40711112l329.83722667 288.60643555c9.45834667 8.27619555 23.83416889 7.31704889 32.11036445-2.14129778s7.31704889-23.83416889-2.14129778-32.11036444l-329.83722667-288.60643556c-8.78023111-7.68227555-8.87921778-18.71075555-0.35612445-26.43399111l330.48803556-299.50520889c9.31157333-8.43889778 10.02040889-22.82951111 1.58037334-32.14222222-8.43889778-9.31157333-22.82951111-10.02040889-32.14222223-1.58037333l-330.48803555 299.50520888z" p-id="15006" fill="#ffffff"/></svg>';
    count = 0;
    icon = `<span style="width: 9px;height: 3px;background-color:#4D4DFF "></span>`
    constructor(parentHtml,style = {}) {
        this.box = document.createElement('div');
        this.box.style.backgroundColor = 'transparent';
        this.box.style.border = 'solid #4D4DFF 3px';
        this.box.style.borderRadius = '50%';
        this.box.style.boxShadow = '0px 6px 20px rgba(25,25,26,.06), 0px 2px 12px rgba(25,25,26,.04)';
        this.box.style.width = '12px';
        this.box.style.height = '12px';
        // this.box.style.padding = '2px';
        this.box.className = 'hide_button';
        this.box.style.display = 'none';
        this.box.style.zIndex = '999';
        this.box.style.cursor = 'pointer';
        this.box.style.display = 'flex';
        this.box.style.justifyContent = 'center';
        this.box.style.alignItems = 'center';
        this.box.style.color = "#4D4DFF";
        this.box.style.fontSize = '10px';
        this.box.style.fontWeight = '600';
        this.setStyle(this.box,style);
        parentHtml.appendChild(this.box);
    }
    onClick(){
        if(this.mind.childrenVisible){
            let count = collapseChildPlugin.collapse(this);
            this.mind.singleton.collapseButton.setNumber(count);

            // 从当前节点处更新
            _toolBoxPlugin.update(meta2d.findOne(this.mind.rootId));
        }else{
            collapseChildPlugin.extend(this,false);
            this.mind.singleton.collapseButton.setIcon();
            _toolBoxPlugin.update(meta2d.findOne(this.mind.rootId));
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
    destroy(){
        this.box.parentNode.removeChild(this.box)
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
    translatePosition(pen,direction){
        // this.hide();
        const store = pen.calculative.canvas.store;
        const worldRect = pen.calculative.worldRect;
        if(!direction)direction = pen.mind.direction
        this.box.style.position = 'absolute';
        this.box.style.outline = 'none';
        this.box.style.zIndex = '10'
        let pos = {
            x:"-999",
            y:"-999"
        };
        switch (direction) {
            case 'right':
                pos.x = worldRect.x + store.data.x + worldRect.width + 6 + 'px';
                pos.y = worldRect.y + store.data.y + worldRect.height / 2 + 'px';
                this.box.style.transform = "translateY(-50%)";

                break;
            case 'left':
                pos.x = worldRect.x + store.data.x - 20 + 'px';
                pos.y = worldRect.y + store.data.y + worldRect.height / 2 + 'px';
                this.box.style.transform = "translateY(-50%)";

                break
            case 'top':
                pos.x = worldRect.x + store.data.x + worldRect.width / 2 + 'px';
                pos.y = worldRect.y + store.data.y + - 20 + 'px';
                this.box.style.transform = "translateX(-50%)";

                break
            case 'bottom':
                pos.x = worldRect.x + store.data.x + worldRect.width / 2 + 'px';
                pos.y = worldRect.y + store.data.y + worldRect.height + 6 + 'px';
                this.box.style.transform = "translateX(-50%)";

                break
            default :
                if(pen.mind.collapse?.offset){
                    pos.x = worldRect.x + store.data.x + worldRect.width + 6 + pen.mind.collapse.offset.x + 'px';
                    pos.y = worldRect.y + store.data.y + worldRect.height / 2 + pen.mind.collapse.offset.y +'px';
                }else{
                    pos.x = worldRect.x + store.data.x + worldRect.width + 6 + 'px';
                    pos.y = worldRect.y + store.data.y + worldRect.height / 2 + 'px';
                }

        }
        this.box.style.left = pos.x;
        this.box.style.top =  pos.y;
        this.box.style.userSelect = 'none';
        // this.show();
    }

}
