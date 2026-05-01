document.body.style.backgroundColor = "aliceblue";
btn.addEventListener("change", e => {
    if (e.detail === 'dark') {
        document.body.style.backgroundColor = "rgba(0,0,0,0.83)";
        let ele = document.getElementsByClassName("post-card");
        for (let eleElement of ele) {
            eleElement.style.color = "aliceblue";
            eleElement.style.background = "rgba(74,66,94,0.83)";
        }
    }
    else {
        let ele = document.getElementsByClassName("post-card");
        for (let eleElement of ele) {
            eleElement.style.color = "aliceblue";
            eleElement.style.background = "var(--bg)";
        }
        document.body.style.backgroundColor = "aliceblue";
    }
});