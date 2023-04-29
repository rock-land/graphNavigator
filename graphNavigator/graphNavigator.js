import { app } from "/scripts/app.js";

const id = "graphNavigator";

app.registerExtension({
    name: id,
    async setup() {

        var views = [];

        const menu = document.querySelector(".comfy-menu");

        const separator = document.createElement("hr");
        separator.style.margin = "20px 0";
        separator.style.width = "100%";
        menu.append(separator);

        const graphNavigatorDiv = document.createElement("div");
        graphNavigatorDiv.classList.add("graphNavigator");
        graphNavigatorDiv.classList.add("comfy-menu-btns");
        graphNavigatorDiv.style.width = "100%";

        const viewsList = document.createElement("ul");
        viewsList.classList.add("views-list");
        viewsList.style.listStyleType = "none";

        viewsList.style.padding = 0;
        viewsList.style.margin = 0;

        // save view
        const addButton = document.createElement("button");
        addButton.textContent = "💾";
        addButton.style.width = "25%";
        addButton.style.fontSize = "large";
        addButton.style.margin = "10px 0";
        addButton.onclick = () => {
            const viewName = `View ${views.length + 1}`;
            const { ds: { scale, offset } } = app.canvas;

            const view = {
                name: viewName,
                scale,
                offsetX: offset[0],
                offsetY: offset[1],
            };

            views.push(view);
            renderView(view);
            saveViews();
        };
        
        // update menu
        graphNavigatorDiv.append(viewsList);
        graphNavigatorDiv.append(addButton);
        menu.append(graphNavigatorDiv);

        const renderView = (view) => {
            const listItem = document.createElement("li");
            listItem.classList.add("view");
            listItem.draggable = true;

            listItem.ondragstart = (event) => {
                event.dataTransfer.setData("text/plain", views.findIndex((v) => v.name === view.name));
            };

            listItem.ondragover = (event) => {
                event.preventDefault();
            };

            listItem.ondrop = (event) => {
                event.preventDefault();
                const draggedViewIndex = parseInt(event.dataTransfer.getData("text/plain"), 10);
                const targetViewIndex = views.findIndex((v) => v.name === view.name);

                // Swap views
                [views[draggedViewIndex], views[targetViewIndex]] = [views[targetViewIndex], views[draggedViewIndex]];

                // Re-render the views list
                viewsList.innerHTML = "";
                views.forEach(renderView);

                saveViews();
            };

            const name = document.createElement("button");
            name.classList.add("view-name");
            name.classList.add("button");
            name.style.fontSize = "medium";
            name.style.width = "80%";
            name.textContent = view.name;
            name.onclick = () => {
                updateGraph(view);
            };

            name.ondblclick = () => {
                const newName = prompt("Enter a new name for the view:", name.textContent);
                if (newName) {
                    view.name = newName;
                    name.textContent = newName;
                    saveViews();
                }
            };

            listItem.append(name);
            viewsList.append(listItem);

            // Add context menu
            listItem.oncontextmenu = (event) => {
                event.preventDefault();
                const contextMenu = document.createElement("div");
                contextMenu.classList.add("context-menu");
                contextMenu.style.position = "absolute";
                contextMenu.style.top = event.clientY + "px";
                contextMenu.style.left = event.clientX + "px";
                contextMenu.style.backgroundColor = "white";
                contextMenu.style.border = "1px solid black";
                contextMenu.style.zIndex = 1000;

                // Rename menu item
                const renameMenuItem = document.createElement("button");
                renameMenuItem.textContent = "Rename";
                renameMenuItem.style.display = "block";
                renameMenuItem.onclick = () => {
                    const newName = prompt("Enter a new name for the view:", name.textContent);
                    if (newName) {
                        view.name = newName;
                        name.textContent = newName;
                        saveViews();
                    }
                    contextMenu.remove();
                };
                contextMenu.append(renameMenuItem);

                // Delete menu item
                const deleteMenuItem = document.createElement("button");
                deleteMenuItem.textContent = "Delete";
                deleteMenuItem.style.display = "block";
                deleteMenuItem.onclick = () => {
                    const index = views.findIndex((v) => v.name === view.name);
                    if (index !== -1) {
                        views.splice(index, 1);
                        saveViews();
                    }
                    listItem.remove();
                    contextMenu.remove();
                };
                contextMenu.append(deleteMenuItem);

                document.body.append(contextMenu);

                // Close the context menu when clicking outside of it
                window.addEventListener("click", () => {
                    contextMenu.remove();
                });
            };

            // Add horizontal line after every 4 views
            const index = views.findIndex((v) => v.name === view.name);
            if (index % 4 === 3) {
                const separator = document.createElement("hr");
                separator.style.margin = "10px 0";
                separator.style.width = "100%";
                viewsList.append(separator);
            }

            // update graph scale and offset
            const updateGraph = (view) => {
                const { offsetX, offsetY, scale } = view;
                app.canvas.setZoom(scale);
                app.canvas.ds.offset = new Float32Array([offsetX, offsetY]);
                app.canvas.setDirty(true, true);
            }

            // shortcuts: press ctrl-shift-Fn keys to update graph
            document.addEventListener("keydown", (event) => {
                if (event.ctrlKey && event.shiftKey) {
                    const fKeyIndex = getFKeyIndex(event.code);
                    if (fKeyIndex >= 1 && fKeyIndex <= 12 && views[fKeyIndex - 1]) {
                        const view = views[fKeyIndex - 1];
                        updateGraph(view);
                    }
                }
            });

        };

        const saveViews = () => {
            // save views to local storage
            localStorage.setItem(id, JSON.stringify(views));
        };

        const loadViews = () => {
            // load views from local storage
            const loadedViews = localStorage.getItem(id);
            if (loadedViews) {
                views = JSON.parse(loadedViews);
                for (let key in views) {
                    let view = views[key];
                    renderView(view);
                }
            }
        };

        loadViews();
    },
});

function getFKeyIndex(code) {
    if (code.startsWith("F")) {
        const index = parseInt(code.slice(1), 10);
        if (!isNaN(index)) {
            return index;
        }
    }
    return -1;
}
