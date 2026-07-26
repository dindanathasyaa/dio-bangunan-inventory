from PIL import Image

def analyze_white_blobs(input_path):
    img = Image.open(input_path).convert('RGBA')
    width, height = img.size
    pixels = img.load()
    
    visited = set()
    blobs = []
    
    def is_white(r, g, b, a):
        return r > 200 and g > 200 and b > 200 and a > 0
        
    for y in range(height):
        for x in range(width):
            if (x, y) not in visited and is_white(*pixels[x, y]):
                # BFS
                q = [(x, y)]
                visited.add((x, y))
                size = 0
                while q:
                    cx, cy = q.pop(0)
                    size += 1
                    for nx, ny in [(cx+1, cy), (cx-1, cy), (cx, cy+1), (cx, cy-1)]:
                        if 0 <= nx < width and 0 <= ny < height:
                            if (nx, ny) not in visited and is_white(*pixels[nx, ny]):
                                visited.add((nx, ny))
                                q.append((nx, ny))
                blobs.append((size, (x, y)))
                
    blobs.sort(reverse=True)
    for i, (size, (x, y)) in enumerate(blobs):
        print(f"Blob {i}: size {size} at {x}, {y}")

analyze_white_blobs('LOGO BARU DIO BANGUNAN.png')
