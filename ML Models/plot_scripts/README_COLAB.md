Colab setup and run instructions

1) Open a new Google Colab notebook.

2) Install dependencies and prepare Kaggle credentials (run this cell):

```bash
pip install -q kaggle matplotlib pillow opencv-python-headless tensorflow
```

3) Upload your kaggle.json (Kaggle API token) to Colab (use the file upload UI or run):

```python
from google.colab import files
files.upload()  # upload kaggle.json
```

4) Move the token into place and set permissions:

```bash
mkdir -p ~/.kaggle
mv kaggle.json ~/.kaggle/
chmod 600 ~/.kaggle/kaggle.json
```

5) Download and unzip a dataset from Kaggle (replace <dataset-slug> with your dataset path):

```bash
kaggle datasets download -d <dataset-slug> -p /content --unzip
```

6) Run one of the training+plot scripts (adjust paths and parameters). Examples:

Brain tumor example (expects folders `no/` and `yes/` inside data_dir):

```bash
python "ML Models/plot_scripts/train_plot_brain_tumor.py" --data_dir /content/<unzipped-folder> --epochs 10 --batch_size 16 --out_dir /content/brain_plots
```

Pneumonia example (expects folders `NORMAL/` and `PNEUMONIA/` inside data_dir):

```bash
python "ML Models/plot_scripts/train_plot_pneumonia.py" --data_dir /content/<unzipped-folder> --epochs 40 --batch_size 16 --out_dir /content/pneumonia_plots
```

Breast (CBIS) example (expects two class subfolders inside data_dir):

```bash
python "ML Models/plot_scripts/train_plot_breast_cbis.py" --data_dir /content/<unzipped-folder> --epochs 20 --batch_size 32 --out_dir /content/breast_plots
```

7) Download results: after training, download the `*_accuracy.png` and `*_loss.png` from the `out_dir` via Colab UI or with `files.download()`.

Notes:
- Use smaller `--epochs` and `--batch_size` if RAM is limited. Colab CPU-only runtime will be slower; consider Colab Pro or GPU runtime (Runtime -> Change runtime type -> GPU).
- If datasets are organized differently, adjust `--data_dir` path or reorganize into the expected subfolders.
