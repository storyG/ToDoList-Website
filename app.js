//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// Replace your password!!!
mongoose.connect("mongodb+srv://frank40609:<password>@cluster0.zew3s.mongodb.net/todolistDB");

const itemsSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Item need a name."]
  }
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!",
});

const item2 = new Item({
  name: "Hit the + button to add a new item.",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item.",
});

const listSchema = {
  name: {
    type: String,
    required: [true, "Need List Name"]
  },
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

const defaultItems = [item1, item2, item3];



app.get("/", function(req, res) {
  Item.find({}, function(err, result) {
    if (result.length === 0) {
      Item.insertMany(defaultItems, function(err){
        if (err) {
          console.log(err);
        } else {
          console.log("Default Item Insereted!");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: result});
    }
  });
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName}, function (err, results) {
      if (!err) {
        if (!results) {
          const list = new List({
            name: customListName,
            items: defaultItems
          });
          list.save();
          res.redirect("/" + customListName);
        } else {
          console.log("List Exists!");
          res.render("list", {listTitle: customListName, newListItems: results.items});
        }
      }
  });
});

app.post("/", function(req, res){
  const item = req.body.newItem;
  const list = req.body.list;
  const thisItem = new Item({
    name: item,
  });

  if (list === "Today") {
    thisItem.save();
    res.redirect("/");
  } else {
    List.findOne({name: list}, function (err, foundList) {
      foundList.items.push(thisItem);
      foundList.save();
      res.redirect("/" + list);
    })
  }
});

app.post("/delete", function(req, res){
  const item = req.body.checkedItem;
  const listName = req.body.listName;

  if (listName === "Today") {
    // This is an Item!!!
    Item.findByIdAndRemove(item, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Delete item successfully");
        res.redirect("/");
      }
    });
  } else {
    // This is a List!!!
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: item}}}, function (err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }


});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT || 3000, function () {
  console.log("Server started on port 3000.");
});
