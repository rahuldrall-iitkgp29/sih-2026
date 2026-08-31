"""Geospatial utilities for GeoTIFF metadata extraction."""

from typing import Dict, Any, Optional


def extract_geotiff_metadata(file_path: str) -> Dict[str, Any]:
    """
    Extract metadata from a GeoTIFF file.
    Requires rasterio. Falls back gracefully if not available.
    """
    metadata: Dict[str, Any] = {
        "crs": None,
        "bounds": None,
        "transform": None,
        "resolution": None,
        "nodata": None,
    }

    try:
        import rasterio
        with rasterio.open(file_path) as dataset:
            metadata["crs"] = str(dataset.crs) if dataset.crs else None
            metadata["bounds"] = {
                "left": dataset.bounds.left,
                "bottom": dataset.bounds.bottom,
                "right": dataset.bounds.right,
                "top": dataset.bounds.top,
            } if dataset.bounds else None
            metadata["resolution"] = dataset.res if dataset.res else None
            metadata["nodata"] = dataset.nodata
            metadata["width"] = dataset.width
            metadata["height"] = dataset.height
            metadata["count"] = dataset.count  # Number of bands
            metadata["dtypes"] = list(dataset.dtypes)
    except ImportError:
        # rasterio not installed — skip geo metadata
        pass
    except Exception as e:
        metadata["error"] = str(e)

    return metadata
