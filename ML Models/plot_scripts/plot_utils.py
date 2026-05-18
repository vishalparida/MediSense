import os
import json
import matplotlib.pyplot as plt


def save_history_json(history, out_path):
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w") as f:
        json.dump(history, f)


def save_accuracy_plot(history, out_dir, prefix=""):
    acc = history.get("accuracy") or history.get("acc")
    val_acc = history.get("val_accuracy") or history.get("val_acc")
    epochs = range(1, len(acc) + 1)
    plt.figure()
    plt.plot(epochs, acc, "b-", label="Training acc")
    if val_acc:
        plt.plot(epochs, val_acc, "r-", label="Validation acc")
    plt.title("Training and validation accuracy")
    plt.xlabel("Epochs")
    plt.ylabel("Accuracy")
    plt.legend()
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, f"{prefix}accuracy.png")
    plt.savefig(path)
    plt.close()
    return path


def save_loss_plot(history, out_dir, prefix=""):
    loss = history.get("loss")
    val_loss = history.get("val_loss")
    epochs = range(1, len(loss) + 1)
    plt.figure()
    plt.plot(epochs, loss, "b-", label="Training loss")
    if val_loss:
        plt.plot(epochs, val_loss, "r-", label="Validation loss")
    plt.title("Training and validation loss")
    plt.xlabel("Epochs")
    plt.ylabel("Loss")
    plt.legend()
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, f"{prefix}loss.png")
    plt.savefig(path)
    plt.close()
    return path
