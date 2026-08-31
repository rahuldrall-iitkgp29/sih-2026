# BigEarthNet Adaptation

> **Status: Future Work** — This directory contains scaffolding for fine-tuning
> remote-sensing models on BigEarthNet. It is NOT yet implemented.

## Architecture

```
BigEarthNet-S2 Dataset
        ↓
Dataset Loader (dataset.py)
        ↓
Training Pipeline (train.py)
        ↓
Fine-tuned RS-VLM
        ↓
Model Adapter (app/models/vqa_model.py)
        ↓
SatQuery AI
```

## Files

- `config.yaml` — Training hyperparameters
- `dataset.py` — BigEarthNet dataset loader (scaffold)
- `train.py` — Training script (scaffold)

## To implement

1. Download BigEarthNet-S2 dataset
2. Implement `dataset.py` with proper band loading
3. Choose a base VLM (e.g., BLIP-2, InternVL)
4. Implement adaptation/fine-tuning in `train.py`
5. Export model and register in `app/models/`
