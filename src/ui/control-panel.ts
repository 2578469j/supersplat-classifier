import { EventHandler } from 'playcanvas';
import { Button, Container, Label, NumericInput, Panel, RadioButton, SelectInput, SliderInput, VectorInput } from 'pcui';

class BoxSelection {
    root: HTMLElement;
    svg: SVGElement;
    rect: SVGRectElement;
    dragging = false;
    start = { x: 0, y: 0 };
    end = { x: 0, y: 0 };

    events = new EventHandler();

    constructor(parent: HTMLElement) {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.id = 'select-svg';

        // create rect element
        const rect = document.createElementNS(svg.namespaceURI, 'rect');
        rect.setAttribute('fill', 'none');
        rect.setAttribute('stroke', '#f60');
        rect.setAttribute('stroke-width', '1');
        rect.setAttribute('stroke-dasharray', '5, 5');

        // create input dom
        const root = document.createElement('div');
        root.id = 'select-root';

        const updateRect = () => {
            if (this.dragging) {
                const x = Math.min(this.start.x, this.end.x);
                const y = Math.min(this.start.y, this.end.y);
                const width = Math.abs(this.start.x - this.end.x);
                const height = Math.abs(this.start.y - this.end.y);

                rect.setAttribute('x', x.toString());
                rect.setAttribute('y', y.toString());
                rect.setAttribute('width', width.toString());
                rect.setAttribute('height', height.toString());
            }

            this.svg.style.display = this.dragging ? 'inline' : 'none';
        };

        root.oncontextmenu = (e) => {
            e.preventDefault();
        };

        root.onmousedown = (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (e.button === 0) {
                this.dragging = true;
                this.start.x = this.end.x = e.offsetX;
                this.start.y = this.end.y = e.offsetY;
                updateRect();
            }
        };

        root.onmousemove = (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (e.button === 0 && this.dragging) {
                this.end.x = e.offsetX;
                this.end.y = e.offsetY;
                updateRect();
            }
        };

        root.onmouseup = (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (e.button === 0) {
                const w = root.clientWidth;
                const h = root.clientHeight;

                this.dragging = false;
                updateRect();

                this.events.fire('selectRect', e.shiftKey ? 'add' : (e.ctrlKey ? 'remove' : 'set'), {
                    start: { x: Math.min(this.start.x, this.end.x) / w, y: Math.min(this.start.y, this.end.y) / h },
                    end: { x: Math.max(this.start.x, this.end.x) / w, y: Math.max(this.start.y, this.end.y) / h },
                });
            }
        };

        parent.appendChild(root);
        root.appendChild(svg);
        svg.appendChild(rect);

        this.root = root;
        this.svg = svg;
        this.rect = rect;
    }

    activate() {
        if (!this.active) {
            this.root.style.display = 'block';
            this.events.fire('activated');
        }
    }

    deactivate() {
        if (this.active) {
            this.events.fire('deactivated');
            this.root.style.display = 'none';
        }
    }

    get active() {
        return this.root.style.display === 'block';
    }
}

class BrushSelection {
    root: HTMLElement;
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    svg: SVGElement;
    circle: SVGCircleElement;
    dragging = false;
    radius = 40;
    prev = { x: 0, y: 0 };

    events = new EventHandler();

    constructor(parent: HTMLElement) {
        // create input dom
        const root = document.createElement('div');
        root.id = 'select-root';

        // create svg
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.id = 'select-svg';
        svg.style.display = 'inline';

        // create circle element
        const circle = document.createElementNS(svg.namespaceURI, 'circle');
        circle.setAttribute('r', this.radius.toString());
        circle.setAttribute('fill', 'rgba(255, 102, 0, 0.2)');
        circle.setAttribute('stroke', '#f60');
        circle.setAttribute('stroke-width', '1');
        circle.setAttribute('stroke-dasharray', '5, 5');

        // create canvas
        const canvas = document.createElement('canvas');
        canvas.id = 'select-canvas';

        const context = canvas.getContext('2d');
        context.globalCompositeOperation = 'copy';

        const update = (e: MouseEvent) => {
            const x = e.offsetX;
            const y = e.offsetY;

            circle.setAttribute('cx', x.toString());
            circle.setAttribute('cy', y.toString());

            if (this.dragging) {
                context.beginPath();
                context.strokeStyle = '#f60';
                context.lineCap = 'round';
                context.lineWidth = this.radius * 2;
                context.moveTo(this.prev.x, this.prev.y);
                context.lineTo(x, y);
                context.stroke();

                this.prev.x = x;
                this.prev.y = y;
            }
        };

        root.oncontextmenu = (e) => {
            e.preventDefault();
        };

        root.onmousedown = (e) => {
            e.preventDefault();
            e.stopPropagation();

            this.prev.x = e.offsetX;
            this.prev.y = e.offsetY;

            update(e);

            if (e.button === 0) {
                this.dragging = true;

                // clear canvas
                context.clearRect(0, 0, canvas.width, canvas.height);

                // display it
                canvas.style.display = 'inline';
            }
        };

        root.onmousemove = (e) => {
            e.preventDefault();
            e.stopPropagation();
            update(e);
        };

        root.onmouseup = (e) => {
            e.preventDefault();
            e.stopPropagation();
            update(e);

            if (e.button === 0) {
                this.dragging = false;
                canvas.style.display = 'none';

                this.events.fire(
                    'selectByMask',
                    e.shiftKey ? 'add' : (e.ctrlKey ? 'remove' : 'set'),
                    context.getImageData(0, 0, canvas.width, canvas.height)
                );
            }
        };

        parent.appendChild(root);
        root.appendChild(svg);
        svg.appendChild(circle);
        root.appendChild(canvas);

        this.root = root;
        this.svg = svg;
        this.circle = circle;
        this.canvas = canvas;
        this.context = context;

        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
    }

    activate() {
        if (!this.active) {
            this.root.style.display = 'block';
            this.events.fire('activated');
        }
    }

    deactivate() {
        if (this.active) {
            this.events.fire('deactivated');
            this.root.style.display = 'none';
        }
    }

    get active() {
        return this.root.style.display === 'block';
    }

    smaller() {
        this.radius = Math.max(1, this.radius / 1.05);
        this.circle.setAttribute('r', this.radius.toString());
    }

    bigger() {
        this.radius = Math.min(500, this.radius * 1.05);
        this.circle.setAttribute('r', this.radius.toString());
    }
}


class ControlPanel extends Panel {
    events = new EventHandler;

    constructor(args = { }) {
        Object.assign(args, {
            id: 'control-panel',
            headerText: 'Controls',
            collapsible: false,
            collapsed: false
        });

        super(args);

        const controls = new Container({
            class: 'control-container'
        });

        // camera heading
        const cameraHeading = new Label({
            class: 'control-heading',
            text: 'Camera'
        });

        const focusButton = new Button({
            class: 'control-element',
            text: 'Reset Focus'
        });

        const splatSizeParent = new Container({
            class: 'control-parent'
        });

        const splatSizeLabel = new Label({
            class: 'control-label',
            text: 'Splat Size'
        });

        const splatSizeSlider = new SliderInput({
            class: 'control-element-expand',
            precision: 1,
            min: 0,
            max: 10,
            value: 1
        });

        splatSizeParent.append(splatSizeLabel);
        splatSizeParent.append(splatSizeSlider);

        // selection heading
        const selectionHeading = new Label({
            class: 'control-heading',
            text: 'Selection'
        });

        // select by size
        const selectBySizeParent = new Container({
            class: 'control-parent'
        });

        const selectBySizeRadio = new RadioButton({
            class: 'control-element'
        });

        const selectBySizeLabel = new Label({
            class: 'control-label',
            text: 'Splat Size'
        });

        const selectBySizeSlider = new SliderInput({
            class: 'control-element-expand',
            precision: 4,
            enabled: false
        });

        selectBySizeParent.append(selectBySizeRadio);
        selectBySizeParent.append(selectBySizeLabel);
        selectBySizeParent.append(selectBySizeSlider);

        // select by opacity
        const selectByOpacityParent = new Container({
            class: 'control-parent'
        });

        const selectByOpacityRadio = new RadioButton({
            class: 'control-element'
        });

        const selectByOpacityLabel = new Label({
            class: 'control-label',
            text: 'Splat Opacity'
        });

        const selectByOpacitySlider = new SliderInput({
            class: 'control-element-expand',
            precision: 4,
            enabled: false
        });

        selectByOpacityParent.append(selectByOpacityRadio);
        selectByOpacityParent.append(selectByOpacityLabel);
        selectByOpacityParent.append(selectByOpacitySlider);

        // select by sphere
        const selectBySphereParent = new Container({
            class: 'control-parent'
        });

        const selectBySphereRadio = new RadioButton({
            class: 'control-element'
        });

        const selectBySphereLabel = new Label({
            class: 'control-label',
            text: 'Sphere'
        });

        const selectBySphereCenter = new VectorInput({
            class: 'control-element-expand',
            precision: 4,
            dimensions: 4,
            value: [0, 0, 0, 0.5],
            enabled: false
        });

        selectBySphereParent.append(selectBySphereRadio);
        selectBySphereParent.append(selectBySphereLabel);
        selectBySphereParent.append(selectBySphereCenter);

        // select by plane
        const selectByPlaneParent = new Container({
            class: 'control-parent'
        });

        const selectByPlaneRadio = new RadioButton({
            class: 'control-element'
        });

        const selectByPlaneLabel = new Label({
            class: 'control-label',
            text: 'Plane'
        });

        const selectByPlaneAxis = new SelectInput({
            class: 'control-element',
            defaultValue: 'y',
            options: [
                { v: 'x', t: 'x' },
                { v: 'y', t: 'y' },
                { v: 'z', t: 'z' }
            ],
            enabled: false
        });

        const selectByPlaneOffset = new NumericInput({
            class: 'control-element-expand',
            precision: 2,
            enabled: false
        });

        selectByPlaneParent.append(selectByPlaneRadio);
        selectByPlaneParent.append(selectByPlaneLabel);
        selectByPlaneParent.append(selectByPlaneAxis);
        selectByPlaneParent.append(selectByPlaneOffset);

        // set/add/remove
        const addRemoveParent = new Container({
            class: 'control-parent'
        });

        const setButton = new Button({
            class: 'control-element-expand',
            text: 'Set',
            enabled: false
        });

        const addButton = new Button({
            class: 'control-element-expand',
            text: 'Add',
            enabled: false
        });

        const removeButton = new Button({
            class: 'control-element-expand',
            text: 'Remove',
            enabled: false
        });

        const boxSelectButton = new Button({
            class: 'control-element-expand',
            text: 'Rect',
            enabled: true
        });

        const brushSelectButton = new Button({
            class: 'control-element-expand',
            text: 'Brush',
            enabled: true
        });

        addRemoveParent.append(setButton);
        addRemoveParent.append(addButton);
        addRemoveParent.append(removeButton);
        addRemoveParent.append(boxSelectButton);
        addRemoveParent.append(brushSelectButton);

        // select by cluster
        // const selectByCluster = new Button({
        //     class: 'control-element-expand',
        //     text: 'Cluster',
        //     enabled: true
        // });

        // selectByCluster.on('click', () => {
        //     this.events.fire('selectByCluster', 'set', 0.01, 1);
        // });

        // selection button parent
        const selectionButtonParent = new Container({
            class: 'control-parent'
        });

        // all
        const selectAllButton = new Button({
            class: 'control-element-expand',
            text: 'All'
        });

        // none
        const selectNoneButton = new Button({
            class: 'control-element-expand',
            text: 'None' 
        });

        // invert
        const invertSelectionButton = new Button({
            class: 'control-element-expand',
            text: 'Invert' 
        });

        selectionButtonParent.append(selectAllButton);
        selectionButtonParent.append(selectNoneButton);
        selectionButtonParent.append(invertSelectionButton);

        // scene
        const sceneHeading = new Label({
            class: 'control-heading',
            text: 'Scene'
        });

        const deleteSelectionButton = new Button({
            class: 'control-element',
            text: 'Delete Selected Splats'
        });

        const resetButton = new Button({
            class: 'control-element',
            text: 'Reset Scene'
        });

        // orientation
        const sceneOrientationParent = new Container({
            class: 'control-parent'
        });

        const sceneOrientationLabel = new Label({
            class: 'control-label',
            text: 'Scene Orientation'
        });

        const sceneOrientation = new VectorInput({
            class: 'control-element-expand',
            precision: 4,
            dimensions: 3,
            value: [0, 0, 0]
        });

        sceneOrientationParent.append(sceneOrientationLabel);
        sceneOrientationParent.append(sceneOrientation);

        // export
        const exportHeading = new Label({
            class: 'control-heading',
            text: 'Export to'
        });

        const exportButton = new Button({
            class: 'control-element',
            text: 'Ply file'
        });

        // keyboard
        const keyboardHeading = new Label({
            id: 'keyboard-heading',
            class: 'control-heading',
            text: 'Keyboard'
        });

        const shortcutsLabel = new Label({
            class: 'control-element-expand',
            text: [
                'F - Focus camera',
                'R - Toggle rect selection',
                'B - Toggle brush selection',
                '[ ] - Decrease/Increase brush size',
                'Shift - Add to selection',
                'Ctrl - Remove from selection',
                'Delete - Delete selected splats',
                'Esc - Cancel rect selection',
            ].join('<br>'),
            unsafe: true
        });

        // append
        controls.append(cameraHeading);
        controls.append(focusButton);
        controls.append(splatSizeParent);
        controls.append(selectionHeading);
        controls.append(selectBySizeParent);
        controls.append(selectByOpacityParent);
        controls.append(selectBySphereParent);
        controls.append(selectByPlaneParent);
        controls.append(addRemoveParent);
        // controls.append(selectByCluster);
        controls.append(selectionButtonParent);
        controls.append(sceneHeading);
        controls.append(deleteSelectionButton);
        controls.append(resetButton);
        controls.append(sceneOrientationParent);
        controls.append(exportHeading);
        controls.append(exportButton);
        controls.append(keyboardHeading);
        controls.append(shortcutsLabel);

        this.append(controls);

        const boxSelection = new BoxSelection(document.getElementById('canvas-container'));
        boxSelection.events.on('activated', () => boxSelectButton.class.add('active'));
        boxSelection.events.on('deactivated', () => boxSelectButton.class.remove('active'));
        boxSelection.events.on('selectRect', (op: string, rect: any) => {
            this.events.fire('selectRect', op, rect);
        });

        const brushSelection = new BrushSelection(document.getElementById('canvas-container'));
        brushSelection.events.on('activated', () => brushSelectButton.class.add('active'));
        brushSelection.events.on('deactivated', () => brushSelectButton.class.remove('active'));
        brushSelection.events.on('selectByMask', (op: string, mask: ImageData) => {
            this.events.fire('selectByMask', op, mask);
        });

        const tools = [
            boxSelection,
            brushSelection
        ];

        const deactivate = () => {
            tools.forEach(tool => tool.deactivate());
        };

        const toggle = (tool: any) => {
            if (tool.active) {
                tool.deactivate();
            } else {
                deactivate();
                tool.activate();
            }
        };

        boxSelectButton.on('click', () => toggle(boxSelection));
        brushSelectButton.on('click', () => toggle(brushSelection));

        // radio logic
        const radioGroup = [selectBySizeRadio, selectByOpacityRadio, selectBySphereRadio, selectByPlaneRadio];
        radioGroup.forEach((radio, index) => {
            radio.on('change', () => {
                if (radio.value) {
                    radioGroup.forEach((other) => {
                        if (other !== radio) {
                            other.value = false;
                        }
                    });

                    // update select by
                    this.events.fire('selectBy', index);
                } else {
                    // update select by
                    this.events.fire('selectBy', null);
                }
            });
        });

        const axes: any = {
            x: [1, 0, 0],
            y: [0, 1, 0],
            z: [0, 0, 1]
        };

        let radioSelection: number | null = null;
        this.events.on('selectBy', (index: number | null) => {
            radioSelection = index;

            setButton.enabled = index !== null;
            addButton.enabled = index !== null;
            removeButton.enabled = index !== null;

            const controlSet = [
                [selectBySizeSlider],
                [selectByOpacitySlider],
                [selectBySphereCenter],
                [selectByPlaneAxis, selectByPlaneOffset]
            ];
            
            controlSet.forEach((controls, controlsIndex) => {
                controls.forEach((control) => {
                    control.enabled = index === controlsIndex;
                });
            });

            this.events.fire('selectBySpherePlacement', index === 2 ? selectBySphereCenter.value : [0, 0, 0, 0]);
            this.events.fire('selectByPlanePlacement', index === 3 ? axes[selectByPlaneAxis.value] : [0, 0, 0], selectByPlaneOffset.value);
        });

        const performSelect = (op: string) => {
            switch (radioSelection) {
                case 0: this.events.fire('selectBySize', op, selectBySizeSlider.value); break;
                case 1: this.events.fire('selectByOpacity', op, selectByOpacitySlider.value); break;
                case 2: this.events.fire('selectBySphere', op, selectBySphereCenter.value); break;
                case 3: this.events.fire('selectByPlane', op, axes[selectByPlaneAxis.value], selectByPlaneOffset.value); break;
            }
        }

        setButton.on('click', () => performSelect('set'));
        addButton.on('click', () => performSelect('add'));
        removeButton.on('click', () => performSelect('remove'));

        focusButton.on('click', () => {
            this.events.fire('focusCamera');
        });

        splatSizeSlider.on('change', (value: number) => {
            this.events.fire('splatSize', value);
        });

        selectAllButton.on('click', () => {
            this.events.fire('selectAll');
        });

        selectNoneButton.on('click', () => {
            this.events.fire('selectNone');
        });

        invertSelectionButton.on('click', () => {
            this.events.fire('invertSelection');
        });

        selectBySphereCenter.on('change', () => {
            this.events.fire('selectBySpherePlacement', selectBySphereCenter.value);
        });

        selectByPlaneAxis.on('change', () => {
            this.events.fire('selectByPlanePlacement', axes[selectByPlaneAxis.value], selectByPlaneOffset.value);
        });

        selectByPlaneOffset.on('change', () => {
            this.events.fire('selectByPlanePlacement', axes[selectByPlaneAxis.value], selectByPlaneOffset.value);
        });

        sceneOrientation.on('change', () => {
            this.events.fire('sceneOrientation', sceneOrientation.value);
        });

        deleteSelectionButton.on('click', () => {
            this.events.fire('deleteSelection');
        });

        resetButton.on('click', () => {
            this.events.fire('reset');
        });

        exportButton.on('click', () => {
            this.events.fire('export');
        });

        this.events.on('splat:count', (count: number) => {
            selectionHeading.text = `Selection${count === 0 ? '' : ' (' + count.toString() + ')'}`;
        });

        // keyboard handler
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete') {
                this.events.fire('deleteSelection');
            } else if (e.key === 'Escape') {
                deactivate();
            } else if (e.key === 'R' || e.key === 'r') {
                toggle(boxSelection);
            } else if (e.key === 'F' || e.key === 'f') {
                this.events.fire('focusCamera');
            } else if (e.key === 'B' || e.key === 'b') {
                toggle(brushSelection);
            } else if (e.key === '[') {
                brushSelection.smaller();
            } else if (e.key === ']') {
                brushSelection.bigger();
            }
        });
    }
}

export { ControlPanel };
