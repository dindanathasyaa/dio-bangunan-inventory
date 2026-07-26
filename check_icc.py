from PIL import Image

img = Image.open('LOGO BARU DIO BANGUNAN.png')
print('ICC Profile present:', 'icc_profile' in img.info)
