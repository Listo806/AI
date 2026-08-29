import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from "@nestjs/swagger";
import { PropertiesService } from "./properties.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { CreatePropertyDto } from "./dto/create-property.dto";
import { UpdatePropertyDto } from "./dto/update-property.dto";
import { AddMediaDto } from "./dto/add-media.dto";
import { UpdateMediaDto } from "./dto/update-media.dto";
import { ListingLimitGuard } from "../subscriptions/guards/listing-limit.guard";
import { SubscriptionRequiredGuard } from "../subscriptions/guards/subscription-required.guard";

@ApiTags("properties")
@Controller("properties")
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get("public")
  @ApiOperation({
    summary:
      "Marketplace search: published Ecuador sale/rent with coordinates (no auth)",
    description:
      "Same rules as GET /listings: Ecuador only, lat/lng required, sale/rent only, vacation excluded. mode=buy maps to sale.",
  })
  @ApiQuery({
    name: "city",
    required: false,
    description: "Exact city filter (case-insensitive)",
  })
  @ApiQuery({
    name: "propertyType",
    required: false,
    description:
      "Exact property kind: house, apartment, land, commercial, villa, office",
  })
  @ApiQuery({
    name: "mode",
    required: false,
    description: "Listing mode: sale, rent, or buy (buy = sale)",
  })
  @ApiQuery({
    name: "country",
    required: false,
    description:
      "Optional; only ecuador is allowed. Results are always Ecuador-only regardless.",
  })
  @ApiQuery({
    name: "search",
    required: false,
    description: "Optional text search on title, address, city, description",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Page size (default 20, max 100)",
  })
  @ApiQuery({
    name: "offset",
    required: false,
    description: "Offset for pagination",
  })
  @ApiResponse({
    status: 200,
    description: "Published properties retrieved successfully",
  })
  async findPublic(
    @Query("city") city?: string,
    @Query("propertyType") propertyType?: string,
    @Query("mode") mode?: string,
    @Query("country") country?: string,
    @Query("search") search?: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ) {
    const pagination = {
      limit: limit != null ? parseInt(limit, 10) : undefined,
      offset: offset != null ? parseInt(offset, 10) : undefined,
    };
    return this.propertiesService.findPublic(
      { city, propertyType, mode, country, search },
      pagination,
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard, ListingLimitGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Create a new property" })
  @ApiBody({ type: CreatePropertyDto })
  @ApiResponse({ status: 201, description: "Property created successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Listing limit reached" })
  async create(
    @Body() createPropertyDto: CreatePropertyDto,
    @CurrentUser() user: any,
  ) {
    return this.propertiesService.create(
      createPropertyDto,
      user.id,
      user.teamId,
      user.role,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get all properties (with optional filters and bbox search)",
  })
  @ApiQuery({
    name: "type",
    required: false,
    description: "Filter by property type",
  })
  @ApiQuery({
    name: "status",
    required: false,
    description: "Filter by property status",
  })
  @ApiQuery({ name: "search", required: false, description: "Search query" })
  @ApiQuery({
    name: "west",
    required: false,
    description: "Bounding box west longitude",
  })
  @ApiQuery({ name: "city", required: false, description: "Filter by city" })
  @ApiQuery({
    name: "propertyType",
    required: false,
    description:
      "Filter by property type: house, apartment, land, commercial, villa, office",
  })
  @ApiQuery({ name: "minPrice", required: false, description: "Minimum price" })
  @ApiQuery({ name: "maxPrice", required: false, description: "Maximum price" })
  @ApiQuery({
    name: "south",
    required: false,
    description: "Bounding box south latitude",
  })
  @ApiQuery({
    name: "east",
    required: false,
    description: "Bounding box east longitude",
  })
  @ApiQuery({
    name: "north",
    required: false,
    description: "Bounding box north latitude",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Page size (default 20, max 100)",
  })
  @ApiQuery({
    name: "offset",
    required: false,
    description: "Offset for pagination",
  })
  @ApiResponse({
    status: 200,
    description: "Properties retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async findAll(
    @CurrentUser() user: any,
    @Query("type") type?: string,
    @Query("status") status?: string,
    @Query("search") search?: string,
    @Query("city") city?: string,
    @Query("propertyType") propertyType?: string,
    @Query("minPrice") minPrice?: string,
    @Query("maxPrice") maxPrice?: string,
    @Query("agentId") agentId?: string,
    @Query("teamId") filterTeamId?: string,
    @Query("aiScore") aiScore?: string,
    @Query("west") west?: string,
    @Query("south") south?: string,
    @Query("east") east?: string,
    @Query("north") north?: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ) {
    const pagination = {
      limit: limit != null ? parseInt(limit, 10) : undefined,
      offset: offset != null ? parseInt(offset, 10) : undefined,
    };

    const filters = {
      type,
      status,
      search,
      city,
      propertyType,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      agentId,
      teamId: filterTeamId,
      aiScore,
    };

    if (west && south && east && north) {
      const bbox = {
        west: parseFloat(west),
        south: parseFloat(south),
        east: parseFloat(east),
        north: parseFloat(north),
      };

      return this.propertiesService.findByBbox(
        user.id,
        user.teamId,
        bbox,
        filters,
      );
    }

    return this.propertiesService.findAll(
      user.id,
      user.teamId,
      filters,
      pagination,
      user.role,
    );
  }

  @Get("dashboard")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get properties dashboard metrics" })
  async getDashboard(@CurrentUser() user: any, @Query("range") range = "all") {
    return this.propertiesService.getDashboard(
      user.id,
      user.teamId,
      range,
      user.role,
    );
  }

  @Get("workspace/data")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get Real Estate Workspace data" })
  async getWorkspaceData(@CurrentUser() user: any) {
    return this.propertiesService.getRealEstateWorkspaceData(
      user.id,
      user.teamId,
      user.role,
    );
  }

  @Post("workspace/:section")
  @UseGuards(JwtAuthGuard, SubscriptionRequiredGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Create a Real Estate Workspace record" })
  async createWorkspaceRecord(
    @Param("section") section: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.propertiesService.createRealEstateWorkspaceRecord(
      section,
      body,
      user.id,
      user.teamId,
    );
  }

  @Get(":id")
  @ApiOperation({
    summary:
      "Get property by ID (public, no auth required for published properties)",
  })
  @ApiParam({ name: "id", description: "Property ID" })
  @ApiResponse({ status: 200, description: "Property retrieved successfully" })
  @ApiResponse({ status: 404, description: "Property not found" })
  async findOne(@Param("id") id: string) {
    const property = await this.propertiesService.findById(id);
    if (!property) {
      throw new NotFoundException("Property not found");
    }
    return property;
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, SubscriptionRequiredGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Update a property" })
  @ApiParam({ name: "id", description: "Property ID" })
  @ApiBody({ type: UpdatePropertyDto })
  @ApiResponse({ status: 200, description: "Property updated successfully" })
  @ApiResponse({ status: 403, description: "Active subscription required" })
  @ApiResponse({ status: 404, description: "Property not found" })
  async update(
    @Param("id") id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @CurrentUser() user: any,
  ) {
    return this.propertiesService.update(
      id,
      updatePropertyDto,
      user.id,
      user.teamId,
    );
  }

  @Post(":id/publish")
  @UseGuards(JwtAuthGuard, SubscriptionRequiredGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Publish a property" })
  @ApiParam({ name: "id", description: "Property ID" })
  @ApiResponse({ status: 200, description: "Property published successfully" })
  @ApiResponse({ status: 403, description: "Active subscription required" })
  @ApiResponse({ status: 404, description: "Property not found" })
  async publish(@Param("id") id: string, @CurrentUser() user: any) {
    return this.propertiesService.publish(id, user.id, user.teamId);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, SubscriptionRequiredGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Delete a property" })
  @ApiParam({ name: "id", description: "Property ID" })
  @ApiResponse({ status: 200, description: "Property deleted successfully" })
  @ApiResponse({ status: 403, description: "Active subscription required" })
  @ApiResponse({ status: 404, description: "Property not found" })
  async remove(@Param("id") id: string, @CurrentUser() user: any) {
    await this.propertiesService.delete(id, user.id, user.teamId, user.role);
    return { message: "Property deleted successfully" };
  }

  @Post(":id/media")
  @UseGuards(JwtAuthGuard, SubscriptionRequiredGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Add media to a property" })
  @ApiParam({ name: "id", description: "Property ID" })
  @ApiBody({ type: AddMediaDto })
  @ApiResponse({ status: 201, description: "Media added successfully" })
  @ApiResponse({ status: 403, description: "Active subscription required" })
  async addMedia(
    @Param("id") propertyId: string,
    @Body() addMediaDto: AddMediaDto,
    @CurrentUser() user: any,
  ) {
    return this.propertiesService.addMedia(
      propertyId,
      addMediaDto.url,
      addMediaDto.type || "image",
      addMediaDto.isPrimary || false,
      user.id,
      user.teamId,
    );
  }

  @Get(":id/media")
  @ApiOperation({ summary: "Get all media for a property" })
  @ApiParam({ name: "id", description: "Property ID" })
  @ApiResponse({ status: 200, description: "Media retrieved successfully" })
  async getMedia(@Param("id") propertyId: string) {
    return this.propertiesService.getMedia(propertyId);
  }

  @Put(":id/media/:mediaId")
  @UseGuards(JwtAuthGuard, SubscriptionRequiredGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Update property media" })
  @ApiParam({ name: "id", description: "Property ID" })
  @ApiParam({ name: "mediaId", description: "Media ID" })
  @ApiBody({ type: UpdateMediaDto })
  @ApiResponse({ status: 200, description: "Media updated successfully" })
  @ApiResponse({ status: 403, description: "Active subscription required" })
  async updateMedia(
    @Param("mediaId") mediaId: string,
    @Body() updateMediaDto: UpdateMediaDto,
    @CurrentUser() user: any,
  ) {
    return this.propertiesService.updateMedia(
      mediaId,
      updateMediaDto,
      user.id,
      user.teamId,
    );
  }

  @Delete(":id/media/:mediaId")
  @UseGuards(JwtAuthGuard, SubscriptionRequiredGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Delete property media" })
  @ApiParam({ name: "id", description: "Property ID" })
  @ApiParam({ name: "mediaId", description: "Media ID" })
  @ApiResponse({ status: 200, description: "Media deleted successfully" })
  @ApiResponse({ status: 403, description: "Active subscription required" })
  async deleteMedia(
    @Param("mediaId") mediaId: string,
    @CurrentUser() user: any,
  ) {
    await this.propertiesService.deleteMedia(mediaId, user.id, user.teamId);
    return { message: "Media deleted successfully" };
  }
}
