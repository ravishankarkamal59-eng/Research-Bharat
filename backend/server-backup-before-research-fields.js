const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = 5000;

const articlesFile = path.join(__dirname, "articles.json");

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "ResearchBharat@123";

const sessions = new Set();

app.use(cors());
app.use(express.json());

function getArticles() {
    try {
        return JSON.parse(
            fs.readFileSync(articlesFile, "utf8")
        );
    } catch (error) {
        return [];
    }
}

function saveArticles(articles) {
    fs.writeFileSync(
        articlesFile,
        JSON.stringify(articles, null, 2),
        "utf8"
    );
}

function checkAuth(req, res, next) {

    const token = req.headers.authorization;

    if (!token || !sessions.has(token)) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized"
        });
    }

    next();
}

app.use(express.static(path.join(__dirname, "../frontend")));

app.post("/api/login", (req, res) => {

    const { username, password } = req.body;

    if (
        username !== ADMIN_USERNAME ||
        password !== ADMIN_PASSWORD
    ) {
        return res.status(401).json({
            success: false,
            message: "Username या password गलत है"
        });
    }

    const token = crypto.randomBytes(32).toString("hex");

    sessions.add(token);

    res.json({
        success: true,
        token
    });
});

app.post("/api/logout", checkAuth, (req, res) => {

    sessions.delete(req.headers.authorization);

    res.json({
        success: true,
        message: "Logout successful"
    });
});

app.get("/api/articles", (req, res) => {

    const articles = getArticles();

    res.json({
        success: true,
        count: articles.length,
        articles
    });
});

app.get("/api/articles/:id", (req, res) => {

    const articles = getArticles();

    const article = articles.find(
        item => item.id === Number(req.params.id)
    );

    if (!article) {
        return res.status(404).json({
            success: false,
            message: "Article नहीं मिला"
        });
    }

    res.json({
        success: true,
        article
    });
});

app.post("/api/articles", checkAuth, (req, res) => {

    const {
        title,
        category,
        summary,
        content,
        source
    } = req.body;

    if (
        !title ||
        !category ||
        !summary ||
        !content
    ) {
        return res.status(400).json({
            success: false,
            message: "सभी जरूरी fields भरें"
        });
    }

    const articles = getArticles();

    const newArticle = {
        id: Date.now(),
        title: String(title).trim(),
        category: String(category).trim(),
        summary: String(summary).trim(),
        content: String(content).trim(),
        source: String(source || "Research Bharat").trim()
    };

    articles.unshift(newArticle);

    saveArticles(articles);

    res.json({
        success: true,
        message: "Article successfully added",
        article: newArticle
    });
});

app.put("/api/articles/:id", checkAuth, (req, res) => {

    const articles = getArticles();

    const index = articles.findIndex(
        item => item.id === Number(req.params.id)
    );

    if (index === -1) {
        return res.status(404).json({
            success: false,
            message: "Article नहीं मिला"
        });
    }

    const old = articles[index];

    articles[index] = {
        id: old.id,
        title: String(req.body.title || old.title).trim(),
        category: String(req.body.category || old.category).trim(),
        summary: String(req.body.summary || old.summary).trim(),
        content: String(req.body.content || old.content).trim(),
        source: String(req.body.source || old.source).trim()
    };

    saveArticles(articles);

    res.json({
        success: true,
        message: "Article successfully updated",
        article: articles[index]
    });
});

app.delete("/api/articles/:id", checkAuth, (req, res) => {

    const articles = getArticles();

    const id = Number(req.params.id);

    const exists = articles.some(
        item => item.id === id
    );

    if (!exists) {
        return res.status(404).json({
            success: false,
            message: "Article नहीं मिला"
        });
    }

    saveArticles(
        articles.filter(item => item.id !== id)
    );

    res.json({
        success: true,
        message: "Article deleted successfully"
    });
});

app.get("/api/categories", (req, res) => {

    const articles = getArticles();

    const categories = [
        ...new Set(
            articles.map(article => article.category)
        )
    ];

    res.json({
        success: true,
        categories
    });
});

app.get("/admin.html", (req, res) => {

    res.sendFile(
        path.join(__dirname, "../frontend/admin.html")
    );
});

app.use((req, res) => {

    res.sendFile(
        path.join(__dirname, "../frontend/index.html")
    );
});

app.listen(PORT, () => {

    console.log(
        `Research Bharat Backend running on http://127.0.0.1:${PORT}`
    );

});
