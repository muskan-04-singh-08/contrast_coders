from tensorflow.keras import layers, models
import tensorflow as tf
from tensorflow.keras.applications import VGG19

HR_PATCH_SIZE = 128
LR_PATCH_SIZE = HR_PATCH_SIZE // 4
BATCH_SIZE = 16


def build_vgg_loss_model(hr_shape):

    vgg = VGG19(weights="imagenet", include_top=False, input_shape=hr_shape)
    vgg.trainable = False
    loss_model = models.Model(
        inputs=vgg.input, outputs=vgg.get_layer("block5_conv4").output
    )

    return loss_model


hr_shape = (HR_PATCH_SIZE, HR_PATCH_SIZE, 3)
vgg_loss_model = build_vgg_loss_model(hr_shape)


def residual_block(x):
    res = layers.Conv2D(64, 3, activation="relu", padding="same")(x)
    res = layers.Conv2D(64, 3, padding="same")(res)
    res = layers.Add()([x, res])
    return res


def build_model(lr_shape, upscale_factor=4):
    inputs = layers.Input(shape=lr_shape)
    x = layers.Conv2D(64, 5, activation="relu", padding="same")(inputs)
    conv1 = x

    for _ in range(5):
        x = residual_block(x)

    x = layers.Conv2D(64, 3, padding="same")(x)
    x = layers.Add()([x, conv1])

    x = layers.Conv2D(256, 3, activation="relu", padding="same")(x)
    x = layers.Lambda(lambda t: tf.nn.depth_to_space(t, upscale_factor))(x)

    outputs = layers.Conv2D(3, 3, activation="sigmoid", padding="same")(x)

    return models.Model(inputs, outputs)


mae_loss = tf.keras.losses.MeanAbsoluteError()

content_loss_weight = 1.0
perceptual_loss_weight = 1e-3


def combined_loss(y_true, y_pred):
    content_loss = mae_loss(y_true, y_pred)

    y_true_vgg = tf.keras.applications.vgg19.preprocess_input(y_true * 255.0)
    y_pred_vgg = tf.keras.applications.vgg19.preprocess_input(y_pred * 255.0)

    y_true_features = vgg_loss_model(y_true_vgg)
    y_pred_features = vgg_loss_model(y_pred_vgg)

    perceptual_loss = mae_loss(y_true_features, y_pred_features)

    total_loss = (
        content_loss_weight * content_loss + perceptual_loss_weight * perceptual_loss
    )

    return total_loss


def psnr_metric(y_true, y_pred):
    return tf.image.psnr(y_true, y_pred, max_val=1.0)


model = build_model(lr_shape=(LR_PATCH_SIZE, LR_PATCH_SIZE, 3), upscale_factor=4)
model.compile(optimizer="adam", loss=combined_loss, metrics=[psnr_metric])
model.load_weights("best_model.weights.h5")