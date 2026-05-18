import os
import argparse
import cv2
import numpy as np
from PIL import Image
from tensorflow import keras
from sklearn.model_selection import train_test_split
from keras.utils import normalize, to_categorical
from keras.models import Sequential
from keras.layers import Conv2D, MaxPooling2D, Activation, Dropout, Flatten, Dense
from plot_utils import save_accuracy_plot, save_loss_plot, save_history_json


def load_dataset(data_dir, input_size=64):
    classes = ["no", "yes"]
    dataset = []
    labels = []
    for idx, cls in enumerate(classes):
        cls_dir = os.path.join(data_dir, cls)
        if not os.path.isdir(cls_dir):
            continue
        for fname in os.listdir(cls_dir):
            if fname.lower().endswith((".jpg", ".jpeg", ".png")):
                path = os.path.join(cls_dir, fname)
                img = cv2.imread(path)
                if img is None:
                    continue
                img = Image.fromarray(img, "RGB")
                img = img.resize((input_size, input_size))
                dataset.append(np.array(img))
                labels.append(idx)
    return np.array(dataset), np.array(labels)


def build_model(input_size=64):
    model = Sequential()
    model.add(Conv2D(32, (3,3), input_shape=(input_size, input_size, 3)))
    model.add(Activation('relu'))
    model.add(MaxPooling2D(pool_size=(2,2)))

    model.add(Conv2D(32, (3,3), kernel_initializer='he_uniform'))
    model.add(Activation('relu'))
    model.add(MaxPooling2D(pool_size=(2,2)))

    model.add(Conv2D(64, (3,3), kernel_initializer='he_uniform'))
    model.add(Activation('relu'))
    model.add(MaxPooling2D(pool_size=(2,2)))

    model.add(Flatten())
    model.add(Dense(64))
    model.add(Activation('relu'))
    model.add(Dropout(0.5))
    model.add(Dense(2))
    model.add(Activation('softmax'))
    model.compile(loss='categorical_crossentropy', optimizer='adam', metrics=['accuracy'])
    return model


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--data_dir', required=True, help='Path to dataset folder (contains "no" and "yes" subfolders)')
    parser.add_argument('--epochs', type=int, default=10)
    parser.add_argument('--batch_size', type=int, default=16)
    parser.add_argument('--out_dir', default='plots_output')
    args = parser.parse_args()

    X, y = load_dataset(args.data_dir)
    X = normalize(X, axis=1)
    y = to_categorical(y, num_classes=2)

    x_train, x_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=0)

    model = build_model(input_size=X.shape[1])
    history = model.fit(x_train, y_train, batch_size=args.batch_size, epochs=args.epochs,
                        validation_data=(x_test, y_test), shuffle=False, verbose=1)

    os.makedirs(args.out_dir, exist_ok=True)
    save_accuracy_plot(history.history, args.out_dir, prefix='brain_')
    save_loss_plot(history.history, args.out_dir, prefix='brain_')
    save_history_json(history.history, os.path.join(args.out_dir, 'brain_history.json'))
    model.save(os.path.join(args.out_dir, 'brain_model.h5'))
    print('Plots and model saved to', args.out_dir)


if __name__ == '__main__':
    main()
