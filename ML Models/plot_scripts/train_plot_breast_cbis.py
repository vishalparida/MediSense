import os
import argparse
import cv2
import numpy as np
from PIL import Image
from tensorflow import keras
from sklearn.model_selection import train_test_split
from keras.utils import normalize, to_categorical
from keras.models import Sequential
from keras.layers import Conv2D, BatchNormalization, MaxPooling2D, Activation, Dropout, Flatten, Dense
from plot_utils import save_accuracy_plot, save_loss_plot, save_history_json


def load_dataset(data_dir, input_size=50):
    # Expecting two-class folders e.g. "normal" and "cancer" or similar
    classes = sorted([d for d in os.listdir(data_dir) if os.path.isdir(os.path.join(data_dir, d))])
    dataset = []
    labels = []
    for idx, cls in enumerate(classes):
        cls_dir = os.path.join(data_dir, cls)
        for fname in os.listdir(cls_dir):
            if fname.lower().endswith((".jpg", ".jpeg", ".png")):
                path = os.path.join(cls_dir, fname)
                img = cv2.imread(path)
                if img is None:
                    continue
                if len(img.shape) == 2 or img.shape[2] == 1:
                    img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
                img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                img = Image.fromarray(img)
                img = img.resize((input_size, input_size))
                dataset.append(np.array(img))
                labels.append(idx)
    return np.array(dataset), np.array(labels)


def build_model(input_size=50):
    model = Sequential([
        Conv2D(32, (3,3), activation='relu', input_shape=(input_size, input_size, 3)),
        BatchNormalization(),
        MaxPooling2D(2,2),
        Dropout(0.4),
        Conv2D(64, (3,3), activation='relu'),
        BatchNormalization(),
        MaxPooling2D(2,2),
        Dropout(0.4),
        Conv2D(128, (3,3), activation='relu'),
        BatchNormalization(),
        MaxPooling2D(2,2),
        Dropout(0.4),
        Flatten(),
        Dense(512, activation='relu'),
        Dropout(0.4),
        Dense(1, activation='sigmoid')
    ])
    model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
    return model


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--data_dir', required=True, help='Path to dataset folder with two class subfolders')
    parser.add_argument('--epochs', type=int, default=20)
    parser.add_argument('--batch_size', type=int, default=32)
    parser.add_argument('--out_dir', default='plots_output')
    args = parser.parse_args()

    X, y = load_dataset(args.data_dir)
    X = normalize(X, axis=1)
    # For binary sigmoid output, labels must be shape (n,)
    x_train, x_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=0)

    model = build_model(input_size=X.shape[1])
    history = model.fit(x_train, y_train, batch_size=args.batch_size, epochs=args.epochs,
                        validation_data=(x_test, y_test), shuffle=False, verbose=1)

    os.makedirs(args.out_dir, exist_ok=True)
    save_accuracy_plot(history.history, args.out_dir, prefix='breast_')
    save_loss_plot(history.history, args.out_dir, prefix='breast_')
    save_history_json(history.history, os.path.join(args.out_dir, 'breast_history.json'))
    model.save(os.path.join(args.out_dir, 'breast_model.h5'))
    print('Plots and model saved to', args.out_dir)


if __name__ == '__main__':
    main()
