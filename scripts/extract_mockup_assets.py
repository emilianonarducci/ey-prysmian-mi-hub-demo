"""Extract embedded images from client mockup pptx."""
import shutil
import sys
import zipfile
from pathlib import Path


def extract(src_pptx: Path, out_dir: Path) -> int:
    """Extract all embedded media from a pptx to out_dir. Returns count."""
    out_dir.mkdir(parents=True, exist_ok=True)
    count = 0
    with zipfile.ZipFile(src_pptx) as zf:
        for name in zf.namelist():
            if name.startswith("ppt/media/"):
                fname = Path(name).name
                with zf.open(name) as srcf, open(out_dir / fname, "wb") as dstf:
                    shutil.copyfileobj(srcf, dstf)
                count += 1
    return count


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python scripts/extract_mockup_assets.py <input.pptx> <output_dir>")
        sys.exit(1)
    src = Path(sys.argv[1])
    out = Path(sys.argv[2])
    if not src.exists():
        print(f"Error: source file not found: {src}")
        sys.exit(1)
    n = extract(src, out)
    print(f"Extracted {n} images to {out}")
