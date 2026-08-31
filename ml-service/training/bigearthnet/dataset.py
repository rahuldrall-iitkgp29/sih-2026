"""
BigEarthNet Dataset Loader Placeholder.
Demonstrates the data-loading architecture for remote-sensing multi-spectral patches (Sentinel-2).
"""

from typing import List, Dict, Any, Optional

class BigEarthNetDataset:
    """
    Scaffold loader for BigEarthNet Sentinel-2 multi-spectral dataset.
    Bands: B01, B02 (Blue), B03 (Green), B04 (Red), B05, B06, B07, B08 (NIR), B8A, B09, B11 (SWIR1), B12 (SWIR2).
    """
    def __init__(self, data_dir: str, split: str = "train", bands: Optional[List[str]] = None):
        self.data_dir = data_dir
        self.split = split
        self.bands = bands or ["B02", "B03", "B04", "B08"]
        self.samples: List[Dict[str, Any]] = []
        self._scan_dataset()

    def _scan_dataset(self) -> None:
        """Scan data directory for patch folders and metadata."""
        # Future work: parse GeoTIFF bands and JSON label files
        pass

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Dict[str, Any]:
        """Returns tensor dictionary with multi-spectral channels and multi-hot class labels."""
        raise NotImplementedError("BigEarthNet dataset loading is planned for post-MVP fine-tuning.")
