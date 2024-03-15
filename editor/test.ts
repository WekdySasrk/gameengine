import { ImGui as gui, ImGui_Impl as gui_impl } from "@zhobo63/imgui-ts";
function setupCanvas(canvas: HTMLCanvasElement) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
}

export function ImGuiObject(this: any, obj: any, id: number = 0): number {
    if (obj == null) {
        gui.Text("(null)");
        return 0;
    }
    Object.entries(obj).forEach(([key, value]) => {
        gui.PushID(id);
        id++;
        if (value == null) {
            gui.Text(key + ": (null)");
        } else if (typeof value === "object") {
            if (gui.TreeNode(key)) {
                id = this.ImObject(value, id + 1);
                gui.TreePop();
            }
        } else if (typeof value === "number") {
            let v = (_: number = value as number): number => (obj[key] = _);
            gui.SetNextItemWidth(100);
            gui.InputFloat(key, v);
        } else if (typeof value === "boolean") {
            let v = (_: boolean = value as boolean): boolean => (obj[key] = _);
            gui.SetNextItemWidth(100);
            gui.Checkbox(key, v);
        } else {
            gui.Text(key + ": " + value);
        }
        gui.PopID();
    });
    return id;
}

let _main: Main;

function _loop(time: number) {
    _main.loop(time);
    window.requestAnimationFrame(_loop);
}

function helloworld() {
    gui.Button("Text");
    gui.Text("Version " + gui.VERSION);
    gui.Text("Helloworld");
}

let text = "";
const sb = new gui.StringBuffer(100, text);
function input() {
    let inputComplete = false;

    if (
        gui.InputText("Input", sb, 256, gui.InputTextFlags.EnterReturnsTrue, (input) => {
            console.log(input);
            return 1;
        })
    ) {
        console.log(222);
        // 当按下回车键时
        inputComplete = true;
    }

    if (gui.IsItemDeactivatedAfterEdit()) {
        // 当控件失去焦点并编辑完成后
        inputComplete = true;
    }

    if (inputComplete) {
        // 在输入完成后执行的操作
        // ...
    }
}

function menubar() {
    gui.Begin("My Window");

    if (gui.BeginMenuBar()) {
        if (gui.BeginMenu("File")) {
            if (gui.MenuItem("Open")) {
                // 处理打开操作
            }
            if (gui.MenuItem("Save")) {
                // 处理保存操作
            }
            gui.EndMenu();
        }

        if (gui.BeginMenu("Edit")) {
            if (gui.MenuItem("Cut")) {
                // 处理剪切操作
            }
            if (gui.MenuItem("Copy")) {
                // 处理复制操作
            }
            if (gui.MenuItem("Paste")) {
                // 处理粘贴操作
            }
            gui.EndMenu();
        }

        gui.EndMenuBar();
    }

    // 添加其他 gui 控件

    gui.End();
}

class Main {
    constructor() {}

    prev_time!: number;
    text: gui.ImStringBuffer = new gui.ImStringBuffer(128, "whats up");
    text2: gui.ImStringBuffer = new gui.ImStringBuffer(128, "もじ/もんじ");
    text_area: gui.ImStringBuffer = new gui.ImStringBuffer(128, "whats up multiline");
    text_area2: gui.ImStringBuffer = new gui.ImStringBuffer(
        128,
        "觀自在菩薩，行深般若波羅蜜多時，\n照見五蘊皆空，度一切苦厄。"
    );
    first: boolean = true;
    v4: gui.Vec4 = new gui.Vec4();
    image_src: gui.ImStringBuffer = new gui.ImStringBuffer(128, "");
    textureCache: gui_impl.TextureCache = new gui_impl.TextureCache();
    image!: gui_impl.Texture;

    ImGuiWindow(win: gui.Window) {
        gui.Text("ID:" + win.ID);
        gui.InputFloat2("Pos", win.Pos);
        gui.SliderFloat2("Scroll", win.Scroll, 0, win.ScrollMax.y);
        gui.InputFloat2("ScrollMax", win.ScrollMax);
        gui.Text("ScrollbarX:" + win.ScrollbarX);
        gui.Text("ScrollbarY:" + win.ScrollbarY);
    }

    loop(time: number): void {
        if (gui_impl.is_contextlost) return;
        if (!gui_impl.any_pointerdown() && time - this.prev_time < 1000.0 / 30) {
            //return;
        }
        gui_impl.NewFrame(time);
        gui.NewFrame();

        gui.SetNextWindowSize(new gui.ImVec2(1000, 300));
        menubar();
        // gui.Begin("Hello");
        // helloworld();
        // input();

        // gui.End();

        // gui.ShowDemoWindow();
        gui.EndFrame();
        gui.Render();

        gui_impl.ClearBuffer(new gui.ImVec4(0.25, 0.25, 0.25, 1));
        gui_impl.RenderDrawData(gui.GetDrawData());

        return;

        return;
        // gui_impl.NewFrame(time);
        // gui.NewFrame();
        // gui.SetNextWindowSize(new gui.ImVec2(1000, 300));

        // gui.Begin("Hello");
        // gui.Button("Text");
        // gui.Text("Version " + gui.VERSION);
        // gui.Text("Helloworld");
        // gui.End();
        // gui.EndFrame();
        // gui.Render();

        // gui_impl.ClearBuffer(new gui.ImVec4(0.25, 0.25, 0.25, 1));
        // gui_impl.RenderDrawData(gui.GetDrawData());

        // return;
        this.prev_time = time;

        gui_impl.NewFrame(time);
        gui.NewFrame();
        gui.SetNextWindowSize(new gui.ImVec2(1000, 300));

        if (this.first) {
            gui.SetNextWindowPos(new gui.ImVec2(0, 0));
            if (gui.isMobile.any())
                gui.SetNextWindowSize(
                    new gui.ImVec2(gui_impl.canvas!.scrollWidth, gui_impl.canvas!.scrollHeight)
                );
            this.first = false;
        }

        gui.Begin("Hello");
        gui.Text("Version " + gui.VERSION);
        gui.InputText("Input", this.text);
        gui.SetNextItemWidth(-gui.FLT_MIN);
        gui.InputText("Input2", this.text2);
        gui.InputText("Password", this.text, this.text.size, gui.InputTextFlags.Password);
        gui.InputTextMultiline("Text", this.text_area);
        gui.SetNextItemWidth(-gui.FLT_MIN);
        gui.InputTextMultiline("Text2", this.text_area2);
        gui.TextWrapped(this.text_area2.buffer);
        gui.SliderFloat4("Slider", this.v4, 0, 100);
        gui.InputFloat4("Float4", this.v4);
        //this.ImObject(ImGui.GetCurrentWindow());
        let win = gui.GetHoveredWindow();
        if (win) {
            if (gui.TreeNode("HoveredWindow")) {
                this.ImGuiWindow(win);
                gui.TreePop();
            }
        }
        gui.Text("HoveredID:" + gui.GetHoveredId());
        gui.Text("ActiveID:" + gui.GetActiveId());
        gui.Text("InputTextID:" + gui.GetInputTextId());
        let inpText = gui.GetInputTextState(gui.GetInputTextId());
        if (inpText) {
            if (gui.TreeNode("InputText")) {
                gui.Text("ID:" + inpText.ID);
                gui.Text("Flags:" + inpText.Flags);
                gui.InputFloat2("FrameBBMin", inpText.FrameBB.Min);
                gui.InputFloat2("FrameBBMax", inpText.FrameBB.Max);
                let text: gui.ImStringBuffer = new gui.ImStringBuffer(128, inpText.Text);
                gui.InputText("Text", text);
                gui.TreePop();
            }
        }

        gui.InputFloat2("scroll_acc", gui_impl.scroll_acc);
        gui.TextColored(new gui.ImVec4(0, 1, 0, 1), "FontTexturePool");
        if (gui_impl.dom_font && gui_impl.dom_font.texturePage) {
            gui_impl.dom_font.texturePage.forEach((page) => {
                gui.Image(page.Texure._texture, new gui.ImVec2(512, 512));
            });
        }
        if (gui.InputText("image_src", this.image_src)) {
            this.textureCache.Load("img", this.image_src.buffer).then((img) => {
                this.image = img;
            });
        }
        if (this.image) {
            gui.Image(this.image._texture, new gui.ImVec2(256, 256));

            var drawList: gui.ImDrawList = gui.GetForegroundDrawList();
            drawList.AddImage(this.image._texture, new gui.Vec2(0, 0), new gui.Vec2(100, 100));
        }

        gui.End();
        gui.ShowDemoWindow();
        // gui.ShowMetricsWindow();

        gui.EndFrame();
        gui.Render();

        gui_impl.ClearBuffer(new gui.ImVec4(0.25, 0.25, 0.25, 1));
        gui_impl.RenderDrawData(gui.GetDrawData());
    }
}

window.addEventListener("DOMContentLoaded", async () => {
    setupCanvas(document.getElementById("canvas") as HTMLCanvasElement);
    await gui.default();
    gui.CHECKVERSION();
    console.log("ImGui.CreateContext() VERSION=", gui.VERSION);

    gui.CreateContext();
    gui.StyleColorsDark();
    if (gui.isMobile.any()) {
        gui_impl.setCanvasScale(1);
        gui_impl.setFontScale(1.5);
    }

    const io: gui.IO = gui.GetIO();
    let font = io.Fonts.AddFontDefault();
    //font.FontName="Microsoft JhengHei";
    //font.FontName="Arial";
    font.FontName = "sans-serif";
    font.FontStyle = "bold";
    //font.FontSize=32;
    //font.Ascent=2.5;

    const canvas: HTMLCanvasElement = document.getElementById("canvas") as HTMLCanvasElement;
    gui_impl.Init(canvas);

    _main = new Main();
    window.requestAnimationFrame(_loop);
});
