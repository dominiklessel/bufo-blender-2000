"use server";

export async function processImageAction(formData: FormData) {
  const res = await fetch(process.env.IMAGE_PROCESSING_ENDPOINT as string, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    return { error: "Failed to process the image" };
  }

  const imageUrl = await res.text();

  return { imageUrl };
}
