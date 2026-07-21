<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cross-LLM Prompt Studio v2.0</title>

<style>
/* ============================================================
   GLOBAL RESET
   Removes default browser spacing and makes width/height
   calculations include border + padding (border-box model).
   This prevents unexpected sizing issues later in the layout.
   ============================================================ */
*{
    box-sizing:border-box;
    margin:0;
    padding:0;
}

/* ============================================================
   BODY / PAGE ROOT
   Uses Flexbox in column direction so the header, workspace,
   and footer stack vertically and the workspace can grow to
   fill all remaining vertical space (see "flex:1" below).
   height:100vh makes the whole app fill the browser viewport.
   ============================================================ */
body{
    font-family:Segoe UI,Arial,sans-serif;
    background:#ececec;
    height:100vh;
    display:flex;
    flex-direction:column;
}

/* ============================================================
   HEADER BAR
   Dark blue top bar containing the app title on the left and
   the toolbar buttons on the right. Flexbox with
   justify-content:space-between pushes the two children
   (h1 and #toolbar) to opposite ends of the header.
   ============================================================ */
header{
    background:#1f4e79;
    color:white;
    padding:15px;
    display:flex;
    justify-content:space-between;
    align-items:center;
}

header h1{
    font-size:24px;
}

/* Toolbar container: lays out the action buttons
   (Copy / Clear / Save / Load) side by side with a small gap. */
#toolbar{
    display:flex;
    gap:8px;
}

button{
    padding:8px 14px;
    cursor:pointer;
}

/* ============================================================
   MAIN WORKSPACE
   CSS Grid with two columns:
     - Left column: fixed width 420px (the form/input panel)
     - Right column: 1fr (takes up all remaining space, the preview)
   flex:1 makes this area expand to fill the space between the
   header and footer (thanks to the body's flex-column layout).
   ============================================================ */
#workspace{
    flex:1;
    display:grid;
    grid-template-columns:420px 1fr;
}

/* Left panel: scrollable form area containing all the
   input fields (Task, Exemplar, Role, Style, Additional Info). */
#left{
    background:white;
    overflow:auto;
    padding:20px;
    border-right:1px solid #ccc;
}

/* Right panel: scrollable area that displays the
   live-generated prompt preview text. */
#right{
    background:#f5f5f5;
    overflow:auto;
    padding:20px;
}

/* ============================================================
   FORM "PANEL" COMPONENT
   Each input field (Task, Exemplar, Role, etc.) is wrapped in
   a bordered box with its own header (h2) and body section.
   This creates the visually separated card-like sections seen
   in the left column.
   ============================================================ */
.panel{
    border:1px solid #ccc;
    margin-bottom:20px;
}

/* Light-gray title bar for each panel (e.g. "Task", "Role"). */
.panel h2{
    background:#efefef;
    padding:10px;
    font-size:18px;
}

/* Inner padding around the actual input/textarea element
   inside each panel. */
.panel .body{
    padding:12px;
}

/* ============================================================
   INPUT / TEXTAREA STYLING
   Both take up the full width of their parent panel body.
   Textareas get a minimum height so multi-line fields
   (Exemplar, Additional Information) are usable immediately
   without needing to be manually resized.
   ============================================================ */
input,
textarea{
    width:100%;
    padding:10px;
    margin-top:6px;
}

textarea{
    min-height:120px;
}

/* ============================================================
   PREVIEW BOX
   Displays the compiled prompt (built from all form fields).
   white-space:pre-wrap preserves line breaks / spacing exactly
   as they are set in the JS template string, while still
   wrapping long lines instead of overflowing horizontally.
   A monospace font (Consolas) is used so the prompt structure
   (dashed separators, etc.) lines up visually like real code/text.
   ============================================================ */
.preview{
    background:white;
    border:1px solid #ccc;
    padding:20px;
    min-height:700px;
    white-space:pre-wrap;
    font-family:Consolas,monospace;
}

/* Simple footer bar pinned at the very bottom of the page. */
footer{
    padding:10px;
    background:#f2f2f2;
    border-top:1px solid #ccc;
}

</style>
</head>

<body>

<!-- ============================================================
     TOP HEADER
     Contains the app title and the four toolbar action buttons:
     Copy (copies the generated prompt to clipboard),
     Clear (empties all fields), Save (persists fields to
     localStorage), and Load (restores fields from localStorage).
     ============================================================ -->
<header>

<h1>Cross-LLM Prompt Studio</h1>

<div id="toolbar">

<button id="copyBtn">Copy</button>

<button id="clearBtn">Clear</button>

<button id="saveBtn">Save</button>

<button id="loadBtn">Load</button>

</div>

</header>

<!-- ============================================================
     MAIN WORKSPACE (two columns: form on the left, preview on
     the right — see #workspace grid rules in the <style> block)
     ============================================================ -->
<div id="workspace">

<!-- ------------------------------------------------------------
     LEFT COLUMN: INPUT FORM
     Each <div class="panel"> below represents ONE field of the
     prompt template. Every input/textarea has a unique id that
     is read directly by the JavaScript (App.update /
     App.render) to build the final prompt text on the right.
     ------------------------------------------------------------ -->
<div id="left">

<!-- Short single-line field: what the LLM should actually do. -->
<div class="panel">

<h2>Task</h2>

<div class="body">

<input id="task">

</div>

</div>

<!-- Multi-line field: an example of the desired input/output
     (few-shot example) to guide the model's response. -->
<div class="panel">

<h2>Exemplar</h2>

<div class="body">

<textarea id="example"></textarea>

</div>

</div>

<!-- Short single-line field: persona/role the LLM should adopt
     (e.g. "You are a senior copywriter"). -->
<div class="panel">

<h2>Role</h2>

<div class="body">

<input id="role">

</div>

</div>

<!-- Short single-line field: desired tone/style of the output
     (e.g. "formal", "concise", "friendly"). -->
<div class="panel">

<h2>Style</h2>

<div class="body">

<input id="style">

</div>

</div>

<!-- Multi-line field: any extra context, constraints, or rules
     that don't fit into the other categories above. -->
<div class="panel">

<h2>Additional Information</h2>

<div class="body">

<textarea id="additional"></textarea>

</div>

</div>

</div>

<!-- ------------------------------------------------------------
     RIGHT COLUMN: LIVE PREVIEW
     Shows the compiled prompt text, updated in real time as the
     user types (see App.render() in the script below).
     Starts with placeholder text "Waiting..." before any input
     has been entered / rendered.
     ------------------------------------------------------------ -->
<div id="right">

<div class="preview" id="preview">

Waiting...

</div>

</div>

</div>

<footer>

Cross-LLM Prompt Studio v2.0

</footer>

<script>

/* ================================================================
   APP OBJECT
   A single namespaced object holding all app state and behavior.
   Using one object avoids polluting the global scope with loose
   functions/variables and keeps related logic grouped together.
   ================================================================ */
const App={

/* ------------------------------------------------------------
   In-memory "model" (state) of the app.
   Mirrors exactly what's typed into the 5 form fields.
   This is the single source of truth used both for rendering
   the preview text and for saving/loading via localStorage.
   ------------------------------------------------------------ */
model:{
task:"",
example:"",
role:"",
style:"",
additional:""
},

/* ------------------------------------------------------------
   init()
   Runs once when the page finishes loading (see
   `window.onload = App.init` at the bottom of this script).
   Responsible for:
     1. Wiring up "input" event listeners on every form field
        so the preview updates live as the user types.
     2. Wiring up click handlers for the 4 toolbar buttons.
     3. Triggering an initial render so the preview box shows
        the current (empty) state immediately on page load.
   ------------------------------------------------------------ */
init(){

/* Attach an "input" listener to each of the 5 fields.
   Every keystroke/change triggers App.update(), which syncs
   the DOM values into App.model and re-renders the preview.
   NOTE: relies on global variables (task, example, role, style,
   additional) which exist automatically because browsers expose
   elements with an "id" attribute as global variables by their
   id name (a legacy DOM feature). */
["task","example","role","style","additional"]

.forEach(id=>{

document.getElementById(id)

.addEventListener("input",()=>{

App.update();

});

});

/* COPY button: copies the current rendered preview text
   (not the raw model) to the user's clipboard, so they can
   paste the finished prompt straight into another LLM tool. */
copyBtn.onclick=()=>{

navigator.clipboard.writeText(preview.textContent);

};

/* CLEAR button: resets every input/textarea to an empty
   string, then calls App.update() to sync the model and
   refresh the preview to reflect the now-empty fields. */
clearBtn.onclick=()=>{

task.value="";
example.value="";
role.value="";
style.value="";
additional.value="";
App.update();

};

/* SAVE button: serializes the current App.model to JSON and
   stores it in the browser's localStorage under the key
   "PromptStudio". This persists the data across page reloads
   (but only on the same browser/device). */
saveBtn.onclick=()=>{

localStorage.setItem(

"PromptStudio",

JSON.stringify(App.model)

);

};

/* LOAD button: reads the previously saved JSON string back
   out of localStorage (if any exists), parses it into
   App.model, then manually copies each value into its
   corresponding input/textarea element so the UI reflects
   the restored data. Finally calls App.render() to refresh
   the preview text to match the loaded model.
   If nothing was ever saved (d is null), the function exits
   early and does nothing. */
loadBtn.onclick=()=>{

const d=localStorage.getItem("PromptStudio");

if(!d) return;

App.model=JSON.parse(d);

task.value=App.model.task;
example.value=App.model.example;
role.value=App.model.role;
style.value=App.model.style;
additional.value=App.model.additional;

App.render();

};

/* Run an initial update/render so the preview panel is in
   sync with the (empty) form state as soon as the page loads,
   replacing the static "Waiting..." placeholder text. */
App.update();

},

/* ------------------------------------------------------------
   update()
   Called every time a form field changes (and once on init).
   Step 1: Reads the current value of every input/textarea
            from the DOM and copies it into App.model.
   Step 2: Calls App.render() to rebuild the preview text
            based on the freshly-synced model.
   Keeping "read from DOM" (update) and "write to DOM"
   (render) as separate steps keeps the data flow predictable:
   DOM -> model -> preview.
   ------------------------------------------------------------ */
update(){

App.model.task=task.value;
App.model.example=example.value;
App.model.role=role.value;
App.model.style=style.value;
App.model.additional=additional.value;

App.render();

},

/* ------------------------------------------------------------
   render()
   Builds the final "compiled prompt" string by inserting each
   model field into a labeled template with dashed separators
   between sections, then writes that string into the preview
   <div>'s textContent. Because the .preview CSS class uses
   white-space:pre-wrap, the line breaks and spacing in this
   template literal are preserved exactly as displayed to the
   user — this is what makes it easy to copy/paste directly
   into another LLM's prompt box.
   ------------------------------------------------------------ */
render(){

preview.textContent=

`[TASK]

${App.model.task}

---------------------------------

[EXEMPLAR]

${App.model.example}

---------------------------------

[ROLE]

${App.model.role}

---------------------------------

[STYLE]

${App.model.style}

---------------------------------

[ADDITIONAL INFORMATION]

${App.model.additional}`;

}

};

/* ================================================================
   ENTRY POINT
   Waits until the entire page (including all resources) has
   fully loaded before running App.init(). This guarantees all
   the DOM elements referenced above (task, example, role, etc.)
   already exist when init() tries to attach listeners to them.
   ================================================================ */
window.onload=App.init;

</script>

</body>
</html>
